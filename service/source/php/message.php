<?php
header("Content-type: text/html; charset=utf-8");
require("include/global.php");
if ($_POST['inf']=='get')
{get_msg();}
if($_POST['inf']=='add')
{add_msg();}
if($_POST['inf']=='read')
{update_msg();}
function update_msg(){
  require("include/global.php");
  $id=check_user();
  if(!$id){
    echo "用户登录异常";return;
  }
  //标记信息为已读信息
  $msgid=$_POST['id'];
  $sql="UPDATE `message` SET `isread`=1 WHERE id=$msgid;";
  $rs=mysql_query($sql);
  if($rs){
    echo "true";
  }else{
    echo "服务器繁忙,修改失败";
  }
}
function get_msg(){
  require("include/global.php");
  $id=check_user();
  if(!$id){
    echo "用户登录异常";return;
  }
  //取出未读信息
  $sql="SELECT * FROM `message` WHERE userid=$id and isread=0;";
  $rs=mysql_query($sql);
  $i=0;
  $re=new Array();
  while($rows=mysql_fetch_assoc($rs)){
    $re["id".$i]=$rows['id'];
    $re["userid".$i]=$id;
    $re["msg".$i]=$rows['msg'];
    $re["status".$i]=$rows['status'];
    $re["isread".$i]=0;
    $i++;
  }
  $re["length"]=$i;
  if($rs){
    echo json_encode($re);
  }else {
    echo "服务器繁忙,查询失败";
  }
}
function add_msg(){
  $id=check_user();
  if(!$id){
    echo "用户登录异常";return;
  }
  $text=$_POST['msg'];
  $isread=$_POST['isread'];
  $status=$_POST['status'];
  $sql="INSERT INTO `message`(`id`, `userid`, `msg`, `isread`, `status`) VALUES (null,$id,'$text',$isread,'$status');";
  $rs=mysql_query($sql);
  if($rs){
    echo "true";
  }else{
    echo "服务器繁忙,添加失败";
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
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
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
