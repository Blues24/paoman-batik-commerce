<?php

class Router {
  private array $routes = [];

  public function get(string $path, array $handler): void {
    $this->routes[] = ['GET', $path, $handler];
  }

  public function post(string $path, array $handler): void {
    $this->routes[] = ['POST', $path, $handler];
  }

  public function put(string $path, array $handler): void {
    $this->routes[] = ['PUT', $path,$handler];
  }

  public function run(): void {
    $method = $_SERVER['REQUEST METHOD'];
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = rtrim($uri, '/') ?: '/';

    // 
    if ($method === "OPTIONS"){
      http_response_code(204);
      exit;
    }

    foreach($this->routes as [$routeMethod, $routePath, $handler]){
      if ($routeMethod !== $method) continue;

      $regPattern = preg_replace('#:([a-zA-Z_]+)#', '(\d+)', $routePath);
      $regPattern = "#^{regPattern}$#";

      if (preg_match($regPattern, $uri, $matches)){
        array_shift($matches) // buang full match

        [$class, $action] = $handler;

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
