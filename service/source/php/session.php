<?php
if ($_POST['a']=='session')
{
	get_session();
	}
if ($_POST['b']=='session')
{
	del_session();
	}
function del_session()
{
	session_start();
	session_destroy();
	}
function get_session()
{
	//require("../../include/global.php");
	session_start();
	$ss=array(
	'userid'=>$_SESSION['id'],
	'username'=>$_SESSION["username"],
	'userpassword'=>$_SESSION['password'],
	'checkin'=>$_SESSION["checkin"],
	'email'=>$_SESSION['mail'],
	'phone'=>$_SESSION['phone']
	);
	echo json_encode($ss);
	}
?>
