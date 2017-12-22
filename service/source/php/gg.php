<?php
header("Content-type: text/html; charset=utf-8");
if ($_POST['inf']=='get')
{get_gg();}
if ($_POST['inf']=='get_user_money_list')
{get_user_money_list();}
function get_user_money_list(){
	require("include/global.php");
	mysql_query("SET NAMES UTF8");
	mysql_query("set character_set_client=utf8");
	mysql_query("set character_set_results=utf8");
	$id=check_user();
	if(!$id){
		echo "用户登录异常";
		return;
	}
	//获得玩家金钱排名
	$sql="SELECT id,user,blocknum FROM `user` order by blocknum desc;";
	$rs=mysql_query($sql);
	$i=0;
	$re=array();
	while($rows=mysql_fetch_assoc($rs)){
		$re["id".$i]=$rows['id'];
		$re["user".$i]=$rows['user'];
		$re["blocknum".$i]=$rows['blocknum'];
		$i++;
	}
	$re["length"]=$i;
	if($rs){
		echo json_encode($rs);
	}else {
		echo "服务器繁忙,查询失败";
	}
}
function get_gg()
{
	require("include/global.php");
	mysql_query("SET NAMES UTF8");
	mysql_query("set character_set_client=utf8");
	mysql_query("set character_set_results=utf8");
	$id=check_user();
	if(!$id){
		echo "用户登录异常";
		return;
	}
	$sql="SELECT * FROM `gg` order by id desc;";
	$rs=mysql_query($sql,$link);
	if(mysql_num_rows($rs)>=1)
	{
    $i=0;
		$result=array();
  	while($rows=mysql_fetch_assoc($rs))
  	{
  		$result['id'.$i]=$rows['id'];
  		$result['title'.$i]=$rows['title'];
  		$result['content'.$i]=$rows['content'];
  		$i++;
  		}
  	$result['length']=$i;
    echo json_encode($result);
	}else{
		echo "没有公告";
	}
}
function check_user()
{
	require("include/global.php");
	mysql_query("SET NAMES UTF8");
	mysql_query("set character_set_client=utf8");
	mysql_query("set character_set_results=utf8");
  $user=$_POST['user'];
  $sql = "select * from user where user='$user';";
  $rs = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($rs)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    return $id;
  }
  else{
    return 0;
  }
}
?>
