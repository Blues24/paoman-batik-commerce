<?php

/**
 * Router sederhana untuk menangani HTTP requests.
 * Mendukung GET, POST, PUT, DELETE dengan parameter dinamis.
 */
class Router {
  private array $routes = [];

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
    $this->routes[] = ['PUT', $path,$handler];
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
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = rtrim($uri, '/') ?: '/';

    // Handle OPTIONS request untuk CORS
    if ($method === "OPTIONS"){
      http_response_code(204);
      exit;
    }

    // Loop melalui routes untuk mencocokkan
    foreach($this->routes as [$routeMethod, $routePath, $handler]){
      if ($routeMethod !== $method) continue;
      
      $regPattern = preg_replace('#:([a-zA-Z_]+)#', '(\d+)', $routePath);
      $regPattern = "#^{$regPattern}$#";

      if (preg_match($regPattern, $uri, $matches)){
        array_shift($matches); // buang full match

        list($class, $action) = $handler;

        require_once __DIR__ . "/../controllers/${class}.php";
        $controller = new $class();

        call_user_func_array([$controller, $action], $matches);
        return;
      }

        list($class, $action) = $handler;

        require_once __DIR__ . "/../controllers/${class}.php";
        $controller = new $class();

        call_user_func_array([$controller, $action], $matches);
        return;
      }
    }

    // Jika fungsi diatas tidak jalan akan mengeluarkan http code 404
    http_response_code(404);
    echo json_encode(['success' => false, "failed-message" => "Route tidak ditemukan: $method $uri"]);
  }
}

?>
