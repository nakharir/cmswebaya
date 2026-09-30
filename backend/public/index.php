<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Suppress PHP Deprecated Notices from HTTP Response
|--------------------------------------------------------------------------
|
| PHP 8.4 menghasilkan banyak E_DEPRECATED dari dependency Laravel/Carbon
| yang belum sepenuhnya kompatibel. Jika php.ini mengaktifkan display_errors,
| warning ini akan mengotori HTTP response body sebelum JSON dikirim.
|
| Solusi: nonaktifkan display_errors di level aplikasi dan pastikan
| E_DEPRECATED tidak masuk ke output. Laravel sendiri sudah menangani
| error reporting via Handler dan log channel.
|
*/
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
// Hapus E_DEPRECATED dan E_USER_DEPRECATED dari error_reporting
// agar tidak mengotori HTTP response. Error lain tetap dilaporkan.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

/*
|--------------------------------------------------------------------------
| Check If The Application Is Under Maintenance
|--------------------------------------------------------------------------
|
| If the application is in maintenance / demo mode via the "down" command
| we will load this file so that any pre-rendered content can be shown
| instead of starting the framework, which could cause an exception.
|
*/

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

/*
|--------------------------------------------------------------------------
| Register The Auto Loader
|--------------------------------------------------------------------------
|
| Composer provides a convenient, automatically generated class loader for
| this application. We just need to utilize it! We'll simply require it
| into the script here so we don't need to manually load our classes.
|
*/

require __DIR__.'/../vendor/autoload.php';

/*
|--------------------------------------------------------------------------
| Run The Application
|--------------------------------------------------------------------------
|
| Once we have the application, we can handle the incoming request using
| the application's HTTP kernel. Then, we will send the response back
| to this client's browser, allowing them to enjoy our application.
|
*/

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

$kernel->terminate($request, $response);
