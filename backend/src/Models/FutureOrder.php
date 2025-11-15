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
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOpenOrders(int $walletId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM future_orders 
            WHERE wallet_id = ? AND close_ts IS NULL
            ORDER BY open_ts DESC
        ");
        $stmt->execute([$walletId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $futureOrderId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM future_orders 
            WHERE future_order_id = ?
            LIMIT 1
        ");
        $stmt->execute([$futureOrderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        return $order ?: null;
    }

    public function create(array $data): ?int
    {
        $stmt = $this->db->prepare("
            INSERT INTO future_orders 
            (wallet_id, symbol, side, entry_price, position_size, margin, leverage)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $success = $stmt->execute([
            $data['wallet_id'],
            $data['symbol'],
            $data['side'],
            $data['entry_price'],
            $data['position_size'],
            $data['margin'],
            $data['leverage'],
        ]);

        return $success ? (int)$this->db->lastInsertId() : null;
    }

    public function close(int $futureOrderId, float $exitPrice, float $profit): bool
    {
        $stmt = $this->db->prepare("
            UPDATE future_orders 
            SET close_ts = CURRENT_TIMESTAMP(6), exit_price = ?, profit = ?
            WHERE future_order_id = ?
        ");
        return $stmt->execute([$exitPrice, $profit, $futureOrderId]);
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
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
