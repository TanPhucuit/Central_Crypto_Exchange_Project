<?php

namespace App\Controllers;

use App\Helpers\Response;
use App\Models\P2POrder;
use App\Models\User;
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

        if (empty($data['type']) || empty($data['unit_numbers'])) {
            return Response::error($response, 'Type and unit_numbers are required', 400);
        }

        if (!in_array($data['type'], ['buy', 'sell'])) {
            return Response::error($response, 'Invalid type', 400);
        }

        $p2pModel = new P2POrder();
        $orderId = $p2pModel->create([
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'unit_numbers' => $data['unit_numbers'],
            'merchant_id' => $data['merchant_id'] ?? null
        ]);

        if (!$orderId) {
            return Response::error($response, 'Failed to create order', 500);
        }

        $order = $p2pModel->findById($orderId);
        return Response::success($response, $order, 'Order created', 201);
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
