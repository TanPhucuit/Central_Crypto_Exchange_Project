<?php

use Slim\App;
use App\Controllers\TradingController;

return function (App $app) {
    $app->get('/api/trading/spot/{walletId}/history', [TradingController::class, 'spotHistory']);
    $app->post('/api/trading/spot/buy', [TradingController::class, 'spotBuy']);
    $app->post('/api/trading/spot/sell', [TradingController::class, 'spotSell']);
    $app->post('/api/trading/futures/open', [TradingController::class, 'openFuture']);
    $app->post('/api/trading/futures/{id}/close', [TradingController::class, 'closeFuture']);
    $app->get('/api/trading/futures/open', [TradingController::class, 'getOpenFutures']);
    // History of futures orders per wallet
    $app->get('/api/trading/futures/{walletId}/history', [TradingController::class, 'futureHistory']);
};
