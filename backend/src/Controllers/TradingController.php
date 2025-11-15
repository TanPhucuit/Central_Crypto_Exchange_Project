<?php

namespace App\Controllers;

use App\Helpers\Database;
use App\Helpers\Response;
use App\Models\FutureOrder;
use App\Models\SpotTransaction;
use App\Models\Wallet;
use App\Models\Property;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;

class TradingController
{
    public function spotHistory(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;
        $walletId = (int)$args['walletId'];

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }
        
        $walletModel = new Wallet();
        $wallet = $walletModel->findById($walletId);
        
        if (!$wallet || $wallet['user_id'] != $userId) {
            return Response::error($response, 'Wallet not found', 404);
        }
        
        $spotModel = new SpotTransaction();
        $transactions = $spotModel->getByWalletId($walletId);

        return Response::success($response, $transactions);
    }

    public function spotBuy(Request $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        // Validation
        if (empty($data['user_id']) || empty($data['wallet_id']) || empty($data['symbol']) || empty($data['unit_numbers']) || empty($data['index_price'])) {
            return Response::error($response, 'Missing required fields: user_id, wallet_id, symbol, unit_numbers, index_price', 400);
        }

        // Verify wallet ownership
        $walletModel = new Wallet();
        $wallet = $walletModel->findById($data['wallet_id']);
        
        if (!$wallet || $wallet['user_id'] != $data['user_id']) {
            return Response::error($response, 'Wallet not found', 404);
        }

        if ($wallet['type'] !== 'spot') {
            return Response::error($response, 'Spot wallet required', 400);
        }

        $unitNumbers = (float)$data['unit_numbers'];
        $indexPrice = (float)$data['index_price'];

        if ($unitNumbers <= 0 || $indexPrice <= 0) {
            return Response::error($response, 'unit_numbers and index_price must be greater than zero', 400);
        }

        $totalCost = $unitNumbers * $indexPrice;
        $currentBalance = (float)$wallet['balance'];

        if ($currentBalance < $totalCost) {
            return Response::error($response, 'Insufficient balance', 400);
        }

        $db = Database::getConnection();
        $propertyModel = new Property();
        $spotModel = new SpotTransaction();

        try {
            $db->beginTransaction();

            // Update wallet balance
            $newBalance = $currentBalance - $totalCost;
            $walletModel->setBalance($wallet['wallet_id'], $newBalance);

            // Update holdings
            $property = $propertyModel->getByWalletAndSymbol($wallet['wallet_id'], $data['symbol']);
            if ($property) {
                $currentUnits = (float)$property['unit_number'];
                $currentValue = $currentUnits * (float)$property['average_buy_price'];
                $newUnits = $currentUnits + $unitNumbers;
                $newAvg = $newUnits > 0 ? ($currentValue + $totalCost) / $newUnits : $indexPrice;

                $propertyModel->updateUnitNumber($wallet['wallet_id'], $data['symbol'], $unitNumbers);
                $propertyModel->updateAverageBuyPrice($wallet['wallet_id'], $data['symbol'], $newAvg);
            } else {
                $propertyModel->create($wallet['wallet_id'], $data['symbol'], $indexPrice, $unitNumbers);
            }

            // Record transaction
            $spotModel->create([
                'wallet_id' => $wallet['wallet_id'],
                'symbol' => $data['symbol'],
                'type' => 'buy',
                'index_price' => $indexPrice,
                'unit_numbers' => $unitNumbers,
                'amount' => $totalCost,
                'profit' => null,
            ]);

            $db->commit();

            $updatedProperty = $propertyModel->getByWalletAndSymbol($wallet['wallet_id'], $data['symbol']);
            return Response::success($response, [
                'wallet' => $walletModel->findById($wallet['wallet_id']),
                'property' => $updatedProperty,
            ], 'Buy order executed', 201);
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            return Response::error($response, 'Failed to execute buy order: ' . $e->getMessage(), 500);
        }
    }

    public function spotSell(Request $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        // Validation
        if (empty($data['user_id']) || empty($data['wallet_id']) || empty($data['symbol']) || empty($data['unit_numbers']) || empty($data['index_price'])) {
            return Response::error($response, 'Missing required fields: user_id, wallet_id, symbol, unit_numbers, index_price', 400);
        }

        // Verify wallet ownership
        $walletModel = new Wallet();
        $wallet = $walletModel->findById($data['wallet_id']);
        
        if (!$wallet || $wallet['user_id'] != $data['user_id']) {
            return Response::error($response, 'Wallet not found', 404);
        }

        if ($wallet['type'] !== 'spot') {
            return Response::error($response, 'Spot wallet required', 400);
        }

        $unitNumbers = (float)$data['unit_numbers'];
        $indexPrice = (float)$data['index_price'];

        if ($unitNumbers <= 0 || $indexPrice <= 0) {
            return Response::error($response, 'unit_numbers and index_price must be greater than zero', 400);
        }

        $propertyModel = new Property();
        $property = $propertyModel->getByWalletAndSymbol($wallet['wallet_id'], $data['symbol']);
        if (!$property) {
            return Response::error($response, 'Holding not found', 400);
        }

        $currentUnits = (float)$property['unit_number'];
        if ($currentUnits < $unitNumbers) {
            return Response::error($response, 'Insufficient asset balance', 400);
        }

        $db = Database::getConnection();
        $spotModel = new SpotTransaction();

        try {
            $db->beginTransaction();

            $proceeds = $unitNumbers * $indexPrice;
            $profitPerUnit = $indexPrice - (float)$property['average_buy_price'];
            $profit = $profitPerUnit * $unitNumbers;

            // Update holdings
            $propertyModel->updateUnitNumber($wallet['wallet_id'], $data['symbol'], -$unitNumbers);
            $updatedProperty = $propertyModel->getByWalletAndSymbol($wallet['wallet_id'], $data['symbol']);
            if ($updatedProperty && (float)$updatedProperty['unit_number'] <= 0) {
                $propertyModel->delete($wallet['wallet_id'], $data['symbol']);
                $updatedProperty = null;
            }

            // Update wallet balance
            $walletModel->setBalance($wallet['wallet_id'], (float)$wallet['balance'] + $proceeds);

            // Record transaction
            $spotModel->create([
                'wallet_id' => $wallet['wallet_id'],
                'symbol' => $data['symbol'],
                'type' => 'sell',
                'index_price' => $indexPrice,
                'unit_numbers' => $unitNumbers,
                'amount' => $proceeds,
                'profit' => $profit,
            ]);

            $db->commit();

            return Response::success($response, [
                'wallet' => $walletModel->findById($wallet['wallet_id']),
                'property' => $updatedProperty,
            ], 'Sell order executed', 201);
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            return Response::error($response, 'Failed to execute sell order: ' . $e->getMessage(), 500);
        }
    }

    public function openFuture(Request $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        if (empty($data['user_id']) || empty($data['wallet_id']) || empty($data['symbol']) || empty($data['side']) || empty($data['amount']) || empty($data['entry_price']) || empty($data['leverage'])) {
            return Response::error($response, 'Missing required fields', 400);
        }

        $walletModel = new Wallet();
        $wallet = $walletModel->findById($data['wallet_id']);

        if (!$wallet || $wallet['user_id'] != $data['user_id']) {
            return Response::error($response, 'Wallet not found', 404);
        }

        if ($wallet['type'] !== 'future') {
            return Response::error($response, 'Future wallet required', 400);
        }

        $side = strtolower($data['side']);
        if (!in_array($side, ['long', 'short'], true)) {
            return Response::error($response, 'Invalid side', 400);
        }

        $margin = (float)$data['amount'];
        $entryPrice = (float)$data['entry_price'];
        $leverage = (int)$data['leverage'];

        if ($margin <= 0 || $entryPrice <= 0) {
            return Response::error($response, 'Amount and entry price must be greater than zero', 400);
        }

        if ($leverage < 1 || $leverage > 5) {
            return Response::error($response, 'Leverage must be between 1x and 5x', 400);
        }

        if ((float)$wallet['balance'] < $margin) {
            return Response::error($response, 'Insufficient margin balance', 400);
        }

        $positionSize = ($margin * $leverage) / $entryPrice;

        $db = Database::getConnection();
        $futureModel = new FutureOrder();
    $propertyModel = new Property();

        try {
            $db->beginTransaction();

            $walletModel->setBalance($wallet['wallet_id'], (float)$wallet['balance'] - $margin);

            // Ensure a properties row exists for this wallet+symbol so FK constraint is satisfied.
            $prop = $propertyModel->getByWalletAndSymbol($wallet['wallet_id'], $data['symbol']);
            if (!$prop) {
                // create a placeholder property with zero units (future positions don't require token units)
                $propertyModel->create($wallet['wallet_id'], $data['symbol'], 0.0, 0.0);
            }

            $orderId = $futureModel->create([
                'wallet_id' => $wallet['wallet_id'],
                'symbol' => $data['symbol'],
                'side' => $side,
                'entry_price' => $entryPrice,
                'position_size' => $positionSize,
                'margin' => $margin,
                'leverage' => $leverage,
            ]);

            $db->commit();

            return Response::success($response, [
                'order_id' => $orderId,
                'wallet' => $walletModel->findById($wallet['wallet_id']),
            ], 'Future position opened', 201);
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            return Response::error($response, 'Failed to open position: ' . $e->getMessage(), 500);
        }
    }

    public function closeFuture(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $data = $request->getParsedBody();
        $userId = $data['user_id'] ?? null;
        $exitPrice = isset($data['exit_price']) ? (float)$data['exit_price'] : null;
        $orderId = (int)$args['id'];

        if (!$userId || !$exitPrice || $exitPrice <= 0) {
            return Response::error($response, 'user_id and exit_price are required', 400);
        }

        $futureModel = new FutureOrder();
        $order = $futureModel->findById($orderId);

        if (!$order) {
            return Response::error($response, 'Order not found', 404);
        }

        if ($order['close_ts'] !== null) {
            return Response::error($response, 'Order already closed', 400);
        }

        $walletModel = new Wallet();
        $wallet = $walletModel->findById($order['wallet_id']);

        if (!$wallet || $wallet['user_id'] != $userId) {
            return Response::error($response, 'Unauthorized', 403);
        }

        $entryPrice = (float)$order['entry_price'];
        $positionSize = (float)$order['position_size'];
        $margin = (float)$order['margin'];
        $side = $order['side'];

        $pnl = $side === 'long'
            ? ($exitPrice - $entryPrice) * $positionSize
            : ($entryPrice - $exitPrice) * $positionSize;

        $db = Database::getConnection();

        try {
            $db->beginTransaction();

            $futureModel->close($orderId, $exitPrice, $pnl);
            $walletModel->setBalance($wallet['wallet_id'], (float)$wallet['balance'] + $margin + $pnl);

            $db->commit();

            return Response::success($response, [
                'wallet' => $walletModel->findById($wallet['wallet_id']),
                'order_id' => $orderId,
                'profit' => $pnl,
            ], 'Future position closed');
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            return Response::error($response, 'Failed to close position: ' . $e->getMessage(), 500);
        }
    }

    public function getOpenFutures(Request $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }

        $walletModel = new Wallet();
        $wallet = $walletModel->getByUserIdAndType((int)$userId, 'future');

        if (!$wallet) {
            return Response::success($response, []);
        }

        $futureModel = new FutureOrder();
        $orders = $futureModel->getOpenOrders($wallet['wallet_id']);

        return Response::success($response, $orders);
    }

    public function futureHistory(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;
        $walletId = (int)$args['walletId'];

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }

        $walletModel = new Wallet();
        $wallet = $walletModel->findById($walletId);

        if (!$wallet || $wallet['user_id'] != $userId) {
            return Response::error($response, 'Wallet not found', 404);
        }

        $futureModel = new FutureOrder();
        $orders = $futureModel->getByWalletId($walletId);

        return Response::success($response, $orders);
    }
}
