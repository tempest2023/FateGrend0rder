<?php
if ($_POST['inf']=='login')
{login();}
if($_POST['inf']=='add')
{
  add_user();
}
function AttackFilter($StrKey,$StrValue,$ArrReq){
    if (is_array($StrValue)){
        $StrValue=implode($StrValue);
    }
    if (preg_match("/".$ArrReq."/is",$StrValue)==1){
        return false;
    }
		return true;
}
function add_user()
{
  require("include/global.php");
	$un=$_POST["user"];
	$pwd=md5($_POST["pwd"]);
	$filter = "and|or|select|from|where|union|join|sleep|benchmark|\'|\"|,|\(|\)";
	$flag=true;
	foreach($_POST as $key=>$value){
	    $flag=$flag && AttackFilter($key,$value,$filter);
	}
	if($flag)
	{
      mysql_query("SET NAMES UTF8");
      mysql_query("set character_set_client=utf8");
      mysql_query("set character_set_results=utf8");
      $rebool=true;
      $sql = "select * from user where user='$un';";
      $result = mysql_query($sql,$link);
      $k=0;
      while($rows=mysql_fetch_assoc($result)){
        $k++;
      }
      if($k==1) {echo "用户名已存在";}
      else{
        $sql="INSERT INTO `user`(`id`, `user`, `pwd`,blocknum) VALUES (NULL,'$un','$pwd',100);";
  			$rs=mysql_query($sql,$link);
        $id=mysql_insert_id();
        $time=date("Y-m-d");
        //echo $time."\n".$id."\n";
        $sql="INSERT INTO `myitem`(`id`, `userid`, `itemid`, `itemnum`, `exp`, `date`) VALUES (NULL,$id,41,1,187,'$time');";
        $rs=mysql_query($sql,$link);
  			if($rs)
  			{
  				echo "true";
  				}
  			else{echo "注册失败,请稍后再试!";}
      }
	}else{echo "检测到非法符号!";}
}
function login()
{
	require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
	$un=$_POST["user"];
	$pwd=md5($_POST["pwd"]);
	$filter = "and|or|select|from|where|union|join|sleep|benchmark|\'|\"|,|\(|\)";
	$flag=true;
	foreach($_POST as $key=>$value){
	    $flag=$flag && AttackFilter($key,$value,$filter);
	}
	if($flag)
	{
			$sql="select * from user where user='$un' and pwd='$pwd';";
			$rs=mysql_query($sql,$link);
			if(mysql_num_rows($rs)>=1)
			{

					while($rows=mysql_fetch_assoc($rs))
			{
				$userid=$rows['id'];
			}
				$_SESSION['userid']=$userid;
				$_SESSION["username"]=$un;
				$_SESSION['password']=$pwd;
				$_SESSION["checkin"]=true;
				echo "true";
				}
			else{echo "false";}
	}else{echo "false";}
	}
?>
