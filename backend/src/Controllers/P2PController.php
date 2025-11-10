<?php

namespace App\Controllers;

use App\Helpers\Response;
use App\Models\P2POrder;
use App\Models\User;
use App\Models\Wallet;
use App\Models\BankAccount;
use App\Models\AccountTransaction;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;

class P2PController
{
    public function listOrders(Request $request, ResponseInterface $response): ResponseInterface
    {
        $p2pModel = new P2POrder();
        $orders = $p2pModel->getOpenOrders(50);

        return Response::success($response, $orders);
    }

    public function myOrders(Request $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }

        $p2pModel = new P2POrder();
        $orders = $p2pModel->getByUserId($userId);

        return Response::success($response, $orders);
    }

    public function createOrder(Request $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        if (empty($data['user_id'])) {
            return Response::error($response, 'user_id is required', 400);
        }

        if (empty($data['type']) || empty($data['unit_numbers']) || empty($data['merchant_id'])) {
            return Response::error($response, 'Type, unit_numbers and merchant_id are required', 400);
        }

        if (!in_array($data['type'], ['buy', 'sell'])) {
            return Response::error($response, 'Invalid type', 400);
        }

        // Validate merchant exists
        $userModel = new User();
        $merchant = $userModel->findById($data['merchant_id']);
        if (!$merchant || $merchant['role'] !== 'merchant') {
            return Response::error($response, 'Invalid merchant', 400);
        }

        // Create P2P order with open state
        $p2pModel = new P2POrder();
        $orderId = $p2pModel->create([
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'unit_numbers' => $data['unit_numbers'],
            'merchant_id' => $data['merchant_id'],
            'state' => 'open'
        ]);

        if (!$orderId) {
            return Response::error($response, 'Failed to create order', 500);
        }

        $order = $p2pModel->findById($orderId);
        return Response::success($response, $order, 'Order created', 201);
    }

    public function cancelOrder(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;
        $orderId = (int)$args['id'];

        if (!$userId) {
            return Response::error($response, 'user_id is required', 400);
        }

        $p2pModel = new P2POrder();
        $order = $p2pModel->findById($orderId);

        if (!$order) {
            return Response::error($response, 'Order not found', 404);
        }

        if ($order['user_id'] != $userId) {
            return Response::error($response, 'Unauthorized', 403);
        }

        if ($order['state'] !== 'open') {
            return Response::error($response, 'Can only cancel open orders', 400);
        }

        // Update order state to cancelled
        $p2pModel->updateState($orderId, 'cancelled');

        return Response::success($response, ['order_id' => $orderId], 'Order cancelled');
    }

    public function transferPayment(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $data = $request->getParsedBody();
        $orderId = (int)$args['id'];
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            return Response::error($response, 'user_id is required', 400);
        }

        if (empty($data['source_account']) || empty($data['amount'])) {
            return Response::error($response, 'source_account and amount are required', 400);
        }

        $p2pModel = new P2POrder();
        $order = $p2pModel->findById($orderId);

        if (!$order) {
            return Response::error($response, 'Order not found', 404);
        }

        if ($order['user_id'] != $userId) {
            return Response::error($response, 'Unauthorized', 403);
        }

        if ($order['state'] !== 'open') {
            return Response::error($response, 'Order is not in open state', 400);
        }

        // Get merchant's bank account
        $bankModel = new BankAccount();
        $merchantAccounts = $bankModel->getByUserId($order['merchant_id']);
        
        if (empty($merchantAccounts)) {
            return Response::error($response, 'Merchant has no bank account', 400);
        }

        // Use first bank account or default one
        $merchantAccount = $merchantAccounts[0];

        // Create account transaction
        $txModel = new AccountTransaction();
        $transactionId = $txModel->create([
            'source_account_number' => $data['source_account'],
            'destination_account_number' => $merchantAccount['account_number'],
            'amount' => $data['amount'],
            'transaction_type' => 'p2p_payment',
            'description' => 'P2P Order #' . $orderId . ' - Payment to merchant'
        ]);

        if (!$transactionId) {
            return Response::error($response, 'Failed to create transaction', 500);
        }

        // Update order state to matched (waiting for merchant confirmation)
        $p2pModel->updateState($orderId, 'matched');

        return Response::success($response, [
            'order_id' => $orderId,
            'transaction_id' => $transactionId,
            'merchant_account' => $merchantAccount['account_number']
        ], 'Payment transferred, waiting for merchant confirmation');
    }

    public function confirmAndRelease(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $data = $request->getParsedBody();
        $orderId = (int)$args['id'];
        $merchantId = $data['merchant_id'] ?? null;

        if (!$merchantId) {
            return Response::error($response, 'merchant_id is required', 400);
        }

        $p2pModel = new P2POrder();
        $order = $p2pModel->findById($orderId);

        if (!$order) {
            return Response::error($response, 'Order not found', 404);
        }

        if ($order['merchant_id'] != $merchantId) {
            return Response::error($response, 'Unauthorized - not order merchant', 403);
        }

        if ($order['state'] !== 'matched') {
            return Response::error($response, 'Order is not in matched state', 400);
        }

        // Transfer USDT from merchant wallet to user wallet
        $walletModel = new Wallet();
        
        // Get merchant USDT wallet
        $merchantWallet = $walletModel->getByUserIdAndSymbol($merchantId, 'USDT');
        if (!$merchantWallet || $merchantWallet['balance'] < $order['unit_numbers']) {
            return Response::error($response, 'Insufficient merchant USDT balance', 400);
        }

        // Get user USDT wallet (create if not exists)
        $userWallet = $walletModel->getByUserIdAndSymbol($order['user_id'], 'USDT');
        if (!$userWallet) {
            $walletModel->create([
                'user_id' => $order['user_id'],
                'symbol' => 'USDT',
                'balance' => 0
            ]);
            $userWallet = $walletModel->getByUserIdAndSymbol($order['user_id'], 'USDT');
        }

        // Deduct from merchant
        $newMerchantBalance = $merchantWallet['balance'] - $order['unit_numbers'];
        $walletModel->updateBalance($merchantWallet['wallet_id'], $newMerchantBalance);

        // Add to user
        $newUserBalance = $userWallet['balance'] + $order['unit_numbers'];
        $walletModel->updateBalance($userWallet['wallet_id'], $newUserBalance);

        // Update order state to filled
        $p2pModel->updateState($orderId, 'filled');

        return Response::success($response, [
            'order_id' => $orderId,
            'user_balance' => $newUserBalance,
            'merchant_balance' => $newMerchantBalance
        ], 'Order completed successfully');
    }

    public function updateOrder(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $user = $request->getAttribute('user');
        $orderId = (int)$args['id'];
        $data = $request->getParsedBody();

        $p2pModel = new P2POrder();
        $order = $p2pModel->findById($orderId);

        if (!$order || $order['user_id'] != $user->user_id) {
            return Response::error($response, 'Order not found', 404);
        }

        if (!empty($data['state'])) {
            $p2pModel->updateState($orderId, $data['state']);
        }

        $updatedOrder = $p2pModel->findById($orderId);
        return Response::success($response, $updatedOrder, 'Order updated');
    }

    public function listMerchants(Request $request, ResponseInterface $response): ResponseInterface
    {
        $userModel = new User();
        $merchants = $userModel->getMerchants();
        
        return Response::success($response, $merchants);
    }
}
