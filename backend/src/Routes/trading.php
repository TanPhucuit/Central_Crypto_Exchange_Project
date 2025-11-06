<?php

use Slim\App;
use App\Controllers\TradingController;

return function (App $app) {
    $app->get('/api/trading/spot/{walletId}/history', [TradingController::class, 'spotHistory']);
    $app->post('/api/trading/spot/buy', [TradingController::class, 'spotBuy']);
    $app->post('/api/trading/spot/sell', [TradingController::class, 'spotSell']);
};
