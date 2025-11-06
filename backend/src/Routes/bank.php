<?php

use Slim\App;
use App\Controllers\BankAccountController;

return function (App $app) {
    $app->get('/api/bank', [BankAccountController::class, 'index']);
    $app->post('/api/bank', [BankAccountController::class, 'create']);
    $app->delete('/api/bank/{accountNumber}', [BankAccountController::class, 'delete']);
};
