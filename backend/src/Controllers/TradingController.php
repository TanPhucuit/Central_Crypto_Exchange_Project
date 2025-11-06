<?php

namespace App\Controllers;

use App\Helpers\Response;
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

        // Todo: Add business logic here (check balance, update wallet, update property)
        
        return Response::success($response, ['message' => 'Buy order executed'], 'Success', 201);
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

        // Todo: Add business logic here
        
        return Response::success($response, ['message' => 'Sell order executed'], 'Success', 201);
    }
}
