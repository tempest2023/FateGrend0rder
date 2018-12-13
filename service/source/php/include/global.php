<?php
//session_start();
error_reporting(0);
define('XXCMS_ROOT', str_replace("\\", '/', substr(dirname(__FILE__), 0, -7)));
$http_ref=isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
set_include_path(XXCMS_ROOT.'lib/');
if(strpos($_SERVER['HTTP_HOST'],"localhost")!==false)
{
	$host="localhost";
	$user="你的数据库用户名";
	$pwd  ="你的数据库密码";
	$dbname="数据库名字";
	$conn    ="";
	$port = "8080";
	$mydbcharset="utf8";

	$link = mysql_connect($host,$user,$pwd);
		if(!$link) {
		die("Connect Server Failed: " . mysql_error());
		}
	mysql_select_db($dbname);

}
?>
