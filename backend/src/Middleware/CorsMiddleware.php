<?php

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response;

class CorsMiddleware
{
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $config = require __DIR__ . '/../../config/cors.php';
        
        // Handle preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            $response = new Response();
        } else {
            $response = $handler->handle($request);
        }

        $origin = $request->getHeaderLine('Origin');
        $allowedOrigins = $config['allowed_origins'];

        // Check if origin is allowed
        if (in_array($origin, $allowedOrigins) || in_array('*', $allowedOrigins)) {
            $response = $response
                ->withHeader('Access-Control-Allow-Origin', $origin)
                ->withHeader('Access-Control-Allow-Methods', implode(', ', $config['allowed_methods']))
                ->withHeader('Access-Control-Allow-Headers', implode(', ', $config['allowed_headers']))
                ->withHeader('Access-Control-Max-Age', (string)$config['max_age'])
                ->withHeader('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}
