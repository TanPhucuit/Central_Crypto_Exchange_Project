<?php

return [
    'allowed_origins' => explode(',', $_ENV['CORS_ORIGIN'] ?? 'http://localhost:3000'),
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'max_age' => 3600,
];
