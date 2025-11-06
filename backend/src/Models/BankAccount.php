<?php

namespace App\Models;

use App\Helpers\Database;
use PDO;

class BankAccount
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getByUserId(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM bank_accounts 
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByAccountNumber(string $accountNumber): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM bank_accounts 
            WHERE account_number = ?
            LIMIT 1
        ");
        $stmt->execute([$accountNumber]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        return $account ?: null;
    }

    public function create(array $data): bool
    {
        $stmt = $this->db->prepare("
            INSERT INTO bank_accounts (account_number, bank_name, user_id, account_balance)
            VALUES (?, ?, ?, ?)
        ");
        
        return $stmt->execute([
            $data['account_number'],
            $data['bank_name'],
            $data['user_id'],
            $data['account_balance'] ?? 0
        ]);
    }

    public function updateBalance(string $accountNumber, float $amount): bool
    {
        $stmt = $this->db->prepare("
            UPDATE bank_accounts 
            SET account_balance = account_balance + ?
            WHERE account_number = ?
        ");
        return $stmt->execute([$amount, $accountNumber]);
    }

    public function delete(string $accountNumber): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM bank_accounts 
            WHERE account_number = ?
        ");
        return $stmt->execute([$accountNumber]);
    }
}
