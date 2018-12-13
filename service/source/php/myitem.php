<?php
if ($_POST['inf']=='get')
{get_wp();}
if($_POST['inf']=='add')
{
  add_myitem();
}
function add_myitem()
{
  require("include/global.php");
  $user=$_POST['user'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    $data=$_POST['data'];
    mysql_query("SET NAMES UTF8");
    mysql_query("set character_set_client=utf8");
    mysql_query("set character_set_results=utf8");
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
    if(count($item)==1 && intval($_POST['times'])==1)
    {
      //扣费3 SPHINX$
      $sql="select blocknum from user where user='$user';";
      $rs=mysql_query($sql,$link);
      if($rs==false)
      {
        $rebool=false;
      }
      $num=0;
      while($rows=mysql_fetch_assoc($rs))
      {
        $num=intval($rows['blocknum']);
      }
      $num=$num-3;
      $sql="update user set blocknum=$num where user='$user';";
      $rs=mysql_query($sql,$link);
      if($rs==false)
      {
        $rebool=false;
      }
    }
    if(count($item)==10 && intval($_POST['times'])==10)
    {
      //扣费30 SPHINX$
      $sql="select blocknum from user where user='$user';";
      $rs=mysql_query($sql,$link);
      if($rs==false)
      {
        $rebool=false;
      }
      $num=0;
      while($rows=mysql_fetch_assoc($rs))
      {
        $num=intval($rows['blocknum']);
      }
      $num=$num-30;
      $sql="update user set blocknum=$num where user='$user';";
      $rs=mysql_query($sql,$link);
      if($rs==false)
      {
        $rebool=false;
      }
    }
    $time=date("Y-m-d");
    foreach ($item as $key => $value) {
      $val=json_decode($value);
      $sql="INSERT INTO `myitem`(`id`, `userid`, `itemid`, `itemnum`, `exp`, `date`, `work`) VALUES (NULL,$id,";
      foreach ($val as $k => $v) {
        if($k=="id")
        $sql=$sql."".$v.",";
      }
      $sql=$sql."1,'0','$time',0);";
      $rs=mysql_query($sql,$link);
      if($rs==false){
        $rebool=false;
      }
    }
    echo $rebool;
  }else{
    echo "登录状态异常";
  }
}
function get_wp()
{
	    require("include/global.php");
      mysql_query("SET NAMES UTF8");
      mysql_query("set character_set_client=utf8");
      mysql_query("set character_set_results=utf8");
      $un=$_POST['user'];
      $sql = "select id from user where user='$un';";
      $rs=mysql_query($sql,$link);

      if(mysql_num_rows($rs)>=1)
			{
        $id=0;
      	while($rows=mysql_fetch_assoc($rs))
      	{
          $id=$rows['id'];
        }
              $sql="SELECT * FROM `myitem` where userid=$id and sold=0 order by exp+0  desc;";
        			$rs=mysql_query($sql,$link);
        			if(mysql_num_rows($rs)>=1)
        			{
                $i=0;
              	while($rows=mysql_fetch_assoc($rs))
              	{
                  $sql2="SELECT * FROM `tj` WHERE id=".$rows['itemid']." order by level;";
                  $sql3="SELECT * FROM `user` WHERE id=".$rows['userid'].";";
                  $rs2=mysql_query($sql2,$link);
                  while($rows2=mysql_fetch_assoc($rs2))
                  {
                    $result['name'.$i]=$rows2['name'];
                		$result['level'.$i]=$rows2['level'];
                		$result['type'.$i]=$rows2['type'];
                		$result['strength'.$i]=$rows2['strength'];
                    $result['class'.$i]=$rows2['class'];
                  }
                  $rs3=mysql_query($sql3,$link);
                  while($rows3=mysql_fetch_assoc($rs3))
                  {
                    $result['userid'.$i]=$rows3['userid'];//Myitem 里的userid即用户id
                    $result['user'.$i]=$rows3['user'];
                  }
              		$result['id'.$i]=$rows['id'];//MyitemId
                  $result['work'.$i]=$rows['work'];
                  $result['itemnum'.$i]=$rows['itemnum'];
                  //exp换算等级
                  $result['exp'.$i]=exp_level($rows['exp']);
                  $result['date'.$i]=$rows['date'];
                  $result['itemid'.$i]=$rows['itemid'];//Myitem 里的itmeid即图鉴id
              		$i++;
              		}
              	$result['length']=$i;
                echo json_encode($result);
              }else{echo "false";}
      }
      else{echo "false";}

	}
function level_exp($x){
  //当前等级升一级所需经验|x级到x+1级所需经验
  return ceil(1.88*pow($x,3)-51.7*pow($x,2)+535.7*$x+187);
}
function allexp_from_zero_level($x){
  //从零到x级所需要的所有经验
  $e=0;
  for ($i=0; $i <$x; $i++) {
    $e+=level_exp($i);
  }
  return $e;
}
function exp_level($exp)
{
  //给总exp，返回等级
  $x=0;
  while($exp>level_exp($x))
  {
    $exp=$exp-level_exp($x);
    $x++;
  }
  return $x;
}
?>
