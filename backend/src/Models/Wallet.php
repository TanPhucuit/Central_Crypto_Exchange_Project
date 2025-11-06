<?php

namespace App\Models;

use App\Helpers\Database;
use PDO;

class Wallet
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getByUserId(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM wallets 
            WHERE user_id = ? 
            ORDER BY type, created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function getByUserIdAndType(int $userId, string $type): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM wallets 
            WHERE user_id = ? AND type = ? 
            LIMIT 1
        ");
        $stmt->execute([$userId, $type]);
        $wallet = $stmt->fetch();
        return $wallet ?: null;
    }

    public function findById(int $walletId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM wallets WHERE wallet_id = ? LIMIT 1");
        $stmt->execute([$walletId]);
        $wallet = $stmt->fetch();
        return $wallet ?: null;
    }

    public function updateBalance(int $walletId, float $amount): bool
    {
        $stmt = $this->db->prepare("
            UPDATE wallets 
            SET balance = balance + ? 
            WHERE wallet_id = ?
        ");
        return $stmt->execute([$amount, $walletId]);
    }

    public function setBalance(int $walletId, float $balance): bool
    {
        $stmt = $this->db->prepare("
            UPDATE wallets 
            SET balance = ? 
            WHERE wallet_id = ?
        ");
        return $stmt->execute([$balance, $walletId]);
    }

    public function create(int $userId, string $type, float $balance = 0): ?int
    {
        $stmt = $this->db->prepare("
            INSERT INTO wallets (user_id, type, balance)
            VALUES (?, ?, ?)
        ");
        
        $success = $stmt->execute([$userId, $type, $balance]);
        return $success ? (int)$this->db->lastInsertId() : null;
    }

    // Get wallet with properties (crypto holdings)
    public function getWithProperties(int $walletId): ?array
    {
        $wallet = $this->findById($walletId);
        if (!$wallet) {
            return null;
        }

        $stmt = $this->db->prepare("
            SELECT * FROM properties 
            WHERE wallet_id = ?
        ");
        $stmt->execute([$walletId]);
        $wallet['properties'] = $stmt->fetchAll();

        return $wallet;
    }
}
