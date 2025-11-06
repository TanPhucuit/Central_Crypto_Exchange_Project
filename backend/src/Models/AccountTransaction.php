<?php

namespace App\Models;

use App\Helpers\Database;
use PDO;

class AccountTransaction
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getByAccountNumber(string $accountNumber, int $limit = 50): array
    {
        $limit = (int)$limit;
        $stmt = $this->db->prepare("
            SELECT * FROM account_transactions 
            WHERE source_account_number = ? OR target_account_number = ?
            ORDER BY ts DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$accountNumber, $accountNumber]);
        return $stmt->fetchAll();
    }

    public function findById(int $transactionId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM account_transactions 
            WHERE transaction_id = ?
            LIMIT 1
        ");
        $stmt->execute([$transactionId]);
        $transaction = $stmt->fetch();
        return $transaction ?: null;
    }

    public function create(array $data): ?int
    {
        $stmt = $this->db->prepare("
            INSERT INTO account_transactions 
            (source_account_number, target_account_number, transaction_amount)
            VALUES (?, ?, ?)
        ");
        
        $success = $stmt->execute([
            $data['source_account_number'],
            $data['target_account_number'],
            $data['transaction_amount']
        ]);

        return $success ? (int)$this->db->lastInsertId() : null;
    }

    public function getRecent(int $limit = 100): array
    {
        $limit = (int)$limit;
        $stmt = $this->db->prepare("
            SELECT * FROM account_transactions 
            ORDER BY ts DESC
            LIMIT {$limit}
        ");
        $stmt->execute([]);
        return $stmt->fetchAll();
    }
}
