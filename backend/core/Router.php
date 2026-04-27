<?php

/**
 * Router sederhana untuk menangani HTTP requests.
 * Mendukung GET, POST, PUT, DELETE dengan parameter dinamis.
 * 
 * Simple debug logging untuk development.
 */
class Router {
    private array $routes = [];
    
    private function log(string $msg): void {
        if (!defined('DEBUG_MODE') || !DEBUG_MODE) return;
        
        $logFile = __DIR__ . '/../logs/router.log';
        $timestamp = date('Y-m-d H:i:s');
        $line = "[$timestamp] $msg\n";
        @file_put_contents($logFile, $line, FILE_APPEND);
    }

    /**
     * Menambahkan route GET.
     */
    public function get(string $path, array $handler): void {
        $this->routes[] = ['GET', $path, $handler];
    }

    /**
     * Menambahkan route POST.
     */
    public function post(string $path, array $handler): void {
        $this->routes[] = ['POST', $path, $handler];
    }

    /**
     * Menambahkan route PUT.
     */
    public function put(string $path, array $handler): void {
        $this->routes[] = ['PUT', $path, $handler];
    }

    /**
     * Menambahkan route DELETE.
     */
    public function delete(string $path, array $handler): void {
        $this->routes[] = ['DELETE', $path, $handler];
    }

    /**
     * Menjalankan router untuk mencocokkan request dengan route.
     */
    public function run(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $rawUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uri = rtrim($rawUri, '/') ?: '/';

        $this->log("Method=$method Uri=$uri");

        // Handle OPTIONS request untuk CORS
        if ($method === "OPTIONS") {
            $this->log("OPTIONS request → 204");
            http_response_code(204);
            exit;
        }

        // Loop melalui routes untuk mencocokkan
        foreach ($this->routes as [$routeMethod, $routePath, $handler]) {
            if ($routeMethod !== $method) {
                continue;
            }

            // Build regex pattern dari route path
            // Contoh: /api/produk/:id → /api/produk/(\d+)
            $regPattern = preg_replace('#:([a-zA-Z_]+)#', '(\d+)', $routePath);
            $regPattern = "#^{$regPattern}$#";

            // Test apakah URI cocok dengan pattern
            if (preg_match($regPattern, $uri, $matches)) {
                array_shift($matches); // Buang full match

                $controller = $handler[0];
                $action = $handler[1];
                $controllerPath = __DIR__ . "/../controllers/{$controller}.php";

                $this->log("MATCH: $controller::$action");

                if (!file_exists($controllerPath)) {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => "Controller not found: $controller"
                    ]);
                    $this->log("ERROR: Controller file not found: $controllerPath");
                    exit;
                }

                require_once $controllerPath;

                if (!class_exists($controller)) {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => "Class not found: $controller"
                    ]);
                    $this->log("ERROR: Class not found: $controller");
                    exit;
                }

                $controllerInstance = new $controller();

                if (!method_exists($controllerInstance, $action)) {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => "Method not found: $controller::$action"
                    ]);
                    $this->log("ERROR: Method not found: $controller::$action");
                    exit;
                }

                $this->log("CALL: $controller::$action with " . count($matches) . " params");
                call_user_func_array([$controllerInstance, $action], $matches);
                return;
            }
        }

        // Jika tidak ada route yang match → 404
        $this->log("NO MATCH: $method $uri → 404");
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => "Route tidak ditemukan: $method $uri",
        ]);
    }
}

?>
