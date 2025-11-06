<?php

namespace App\Controllers;

use App\Helpers\Response;
use App\Models\BankAccount;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;

class BankAccountController
{
    public function index(Request $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }

        $bankModel = new BankAccount();
        $accounts = $bankModel->getByUserId($userId);

        return Response::success($response, $accounts);
    }

    public function create(Request $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        if (empty($data['user_id'])) {
            return Response::error($response, 'user_id is required', 400);
        }

        if (empty($data['account_number']) || empty($data['bank_name'])) {
            return Response::error($response, 'Account number and bank name are required', 400);
        }

        $bankModel = new BankAccount();
        
        // Check if account exists
        if ($bankModel->findByAccountNumber($data['account_number'])) {
            return Response::error($response, 'Account already exists', 409);
        }

        $success = $bankModel->create([
            'account_number' => $data['account_number'],
            'bank_name' => $data['bank_name'],
            'user_id' => $data['user_id'],
            'account_balance' => $data['account_balance'] ?? 0
        ]);

        if (!$success) {
            return Response::error($response, 'Failed to create bank account', 500);
        }

        $account = $bankModel->findByAccountNumber($data['account_number']);
        return Response::success($response, $account, 'Bank account created', 201);
    }

    public function delete(Request $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['user_id'] ?? null;
        $accountNumber = $args['accountNumber'];

        if (!$userId) {
            return Response::error($response, 'user_id parameter is required', 400);
        }
        
        $bankModel = new BankAccount();
        $account = $bankModel->findByAccountNumber($accountNumber);

        if (!$account || $account['user_id'] != $userId) {
            return Response::error($response, 'Account not found', 404);
        }

        $bankModel->delete($accountNumber);
        return Response::success($response, null, 'Bank account deleted');
    }
}
