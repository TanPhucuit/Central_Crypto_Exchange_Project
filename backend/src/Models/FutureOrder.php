<?php

namespace App\Models;

use App\Helpers\Database;
use PDO;

class FutureOrder
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getByWalletId(int $walletId, int $limit = 50): array
    {
        $limit = (int)$limit;
        $stmt = $this->db->prepare("
            SELECT * FROM future_orders 
            WHERE wallet_id = ?
            ORDER BY open_ts DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$walletId]);
        return $stmt->fetchAll();
    }

    public function getOpenOrders(int $walletId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM future_orders 
            WHERE wallet_id = ? AND close_ts IS NULL
            ORDER BY open_ts DESC
        ");
        $stmt->execute([$walletId]);
        return $stmt->fetchAll();
    }

    public function findById(int $futureOrderId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM future_orders 
            WHERE future_order_id = ?
            LIMIT 1
        ");
        $stmt->execute([$futureOrderId]);
        $order = $stmt->fetch();
        return $order ?: null;
    }

    public function create(array $data): ?int
    {
        $stmt = $this->db->prepare("
            INSERT INTO future_orders 
            (wallet_id, symbol, leverage)
            VALUES (?, ?, ?)
        ");
        
        $success = $stmt->execute([
            $data['wallet_id'],
            $data['symbol'],
            $data['leverage']
        ]);

        return $success ? (int)$this->db->lastInsertId() : null;
    }

    public function close(int $futureOrderId, float $profit): bool
    {
        $stmt = $this->db->prepare("
            UPDATE future_orders 
            SET close_ts = CURRENT_TIMESTAMP(6), profit = ?
            WHERE future_order_id = ?
        ");
        return $stmt->execute([$profit, $futureOrderId]);
    }

    public function getBySymbol(string $symbol, int $limit = 50): array
    {
        $limit = (int)$limit;
        $stmt = $this->db->prepare("
            SELECT * FROM future_orders 
            WHERE symbol = ?
            ORDER BY open_ts DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$symbol]);
        return $stmt->fetchAll();
    }
}
