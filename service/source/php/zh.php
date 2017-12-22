<?php
header("Content-type: text/html; charset=utf-8");
require("include/global.php");
if ($_POST['inf']=='zh10')
{zh();}
if($_POST['inf']=='add')
{add_msg();}
if($_POST['inf']=='read')
{update_msg();}
function zh(){
  require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $id=check_user();
  if(!$id){
    echo "用户登录异常";return;
  }
  // $num=$_POST['times'];//Default 10
  $data=$_POST['data'];
  $rebool=true;
  $item=array();
  $k=strpos($data,"[",0);
  $data=substr($data,$k+1,strlen($data));
  $k=strrpos($data,"]",0);
  $data=substr($data,0,$k);
  while(strpos($data,"},{",0)>0)
  {
      $data=str_replace("},{","}&&&&&&&&&&{",$data);
    }
  $item=explode("&&&&&&&&&&",$data);
  if(count($item)==10 && intval($_POST['times'])==10)
  {
    $i=0;
    $re=array();
    foreach ($item as $key => $value) {
      $val=json_decode($value);
      $sql="select * from tj where id=";
      foreach ($val as $k => $v) {
        if($k=="id")
        $sql=$sql."".$v.";";
      }
      //echo $sql."\n";
      $rs=mysql_query($sql,$link);
      if(!$rs){
        $rebool=false;
        break;
      }
      while($rows=mysql_fetch_assoc($rs))
      {
        $re["id".$i]=$rows['id'];
        $re["name".$i]=$rows['name'];
        $re["level".$i]=$rows['level'];
        $re["type".$i]=$rows['type'];
        $re["strength".$i]=$rows['strength'];
        $re["class".$i]=$rows['class'];
        $i++;
      }
    }
    $re["length"]=$i;
    if($rebool==false){
      return "false";
    }
    else{
        echo json_encode($re);
    }
  }
}



function check_user()
{
  require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $user=$_POST['user'];
  //echo $user."\n";
  $sql = "select * from user where user='$user';";
  //echo $sql;
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  // echo $k;
  if($k==1){
    return $id;
  }
  else{
    return 0;
  }
}
?>
