<?php

namespace App\Controllers;

use App\Helpers\Response;
use App\Models\Wallet;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;

class WalletController
{
    public function index(Request $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }

        $walletModel = new Wallet();
        $wallets = $walletModel->getByUserId($userId);

        return Response::success($response, $wallets);
    }

    public function getByType(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;
        $type = $args['type'] ?? 'fund';

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }
        
        if (!in_array($type, ['fund', 'spot', 'future'])) {
            return Response::error($response, 'Invalid wallet type', 400);
        }
        
        $walletModel = new Wallet();
        $wallet = $walletModel->getByUserIdAndType($userId, $type);

        if (!$wallet) {
            return Response::error($response, 'Wallet not found', 404);
        }

        return Response::success($response, $wallet);
    }

    public function getWithProperties(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;
        $walletId = (int)$args['id'];

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }
        
        $walletModel = new Wallet();
        $wallet = $walletModel->getWithProperties($walletId);

        if (!$wallet || $wallet['user_id'] != $userId) {
            return Response::error($response, 'Wallet not found', 404);
        }

        return Response::success($response, $wallet);
    }

    public function create(Request $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        if (empty($data['user_id'])) {
            return Response::error($response, 'user_id is required', 400);
        }

        if (empty($data['type'])) {
            return Response::error($response, 'Wallet type is required', 400);
        }

        if (!in_array($data['type'], ['fund', 'spot', 'future'])) {
            return Response::error($response, 'Invalid wallet type', 400);
        }

        $walletModel = new Wallet();
        
        // Check if wallet already exists
        $existing = $walletModel->getByUserIdAndType($data['user_id'], $data['type']);
        if ($existing) {
            return Response::error($response, 'Wallet already exists', 409);
        }

        $walletId = $walletModel->create($data['user_id'], $data['type']);

        if (!$walletId) {
            return Response::error($response, 'Failed to create wallet', 500);
        }

        $wallet = $walletModel->findById($walletId);
        return Response::success($response, $wallet, 'Wallet created', 201);
    }
}
