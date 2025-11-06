<?php

namespace App\Models;

use App\Helpers\Database;
use PDO;

class P2POrder
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getByUserId(int $userId, int $limit = 50): array
    {
        $limit = (int)$limit;
        $stmt = $this->db->prepare("
            SELECT * FROM p2p_orders 
            WHERE user_id = ?
            ORDER BY ts DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByMerchantId(int $merchantId, int $limit = 50): array
    {
        $limit = (int)$limit;
        $stmt = $this->db->prepare("
            SELECT * FROM p2p_orders 
            WHERE merchant_id = ?
            ORDER BY ts DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$merchantId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOpenOrders(int $limit = 50, int $offset = 0): array
    {
        $limit = (int)$limit;
        $offset = (int)$offset;
        $stmt = $this->db->prepare("
            SELECT * FROM p2p_orders 
            WHERE state = 'open'
            ORDER BY ts DESC
            LIMIT {$limit} OFFSET {$offset}
        ");
        $stmt->execute([]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $orderId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM p2p_orders 
            WHERE order_id = ?
            LIMIT 1
        ");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        return $order ?: null;
    }

    public function create(array $data): ?int
    {
        $stmt = $this->db->prepare("
            INSERT INTO p2p_orders 
            (user_id, merchant_id, type, unit_numbers, state)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $success = $stmt->execute([
            $data['user_id'],
            $data['merchant_id'] ?? null,
            $data['type'],
            $data['unit_numbers'],
            $data['state'] ?? 'open'
        ]);

        return $success ? (int)$this->db->lastInsertId() : null;
    }

    public function updateState(int $orderId, string $state): bool
    {
        $stmt = $this->db->prepare("
            UPDATE p2p_orders 
            SET state = ?
            WHERE order_id = ?
        ");
        return $stmt->execute([$state, $orderId]);
    }

    public function linkTransaction(int $orderId, int $transactionId): bool
    {
        $stmt = $this->db->prepare("
            UPDATE p2p_orders 
            SET transaction_id = ?, state = 'filled'
            WHERE order_id = ?
        ");
        return $stmt->execute([$transactionId, $orderId]);
    }

    public function matchWithMerchant(int $orderId, int $merchantId): bool
    {
        $stmt = $this->db->prepare("
            UPDATE p2p_orders 
            SET merchant_id = ?, state = 'matched'
            WHERE order_id = ?
        ");
        return $stmt->execute([$merchantId, $orderId]);
    }
}
