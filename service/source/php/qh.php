<?php
if ($_POST['inf']=='get_servent')
{get_servent();}
if ($_POST['inf']=='get_item')
{get_item();}
if($_POST['inf']=='update')
{
  update_myitem();
}
function update_myitem()
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
    $servent_id=$_POST['servent_id'];
    $data=$_POST['item_id'];
    mysql_query("SET NAMES UTF8");
    mysql_query("set character_set_client=utf8");
    mysql_query("set character_set_results=utf8");
    $rebool=true;
    $item=array();
    // echo $data."\n";
    // echo gettype($data)."\n";
    // echo count($data)."\n";
    // $data=json_encode($data);
    // echo $data."\n";
    // echo gettype($data)."\n";
    // echo count($data)."\n";

    $k=strpos($data,"[",0);
    $data=substr($data,$k+1,strlen($data));
    $k=strrpos($data,"]",0);
    $data=substr($data,0,$k);
    $item=explode(",",$data);
    $exp=0;
    foreach ($item as $key => $value) {
      //统计经验卡的经验值
      $sql="SELECT tj.level as level,tj.type as type FROM `myitem` INNER JOIN tj ON (myitem.itemid = tj.id)  WHERE userid=$id and myitem.id=$value;";
      $rs=mysql_query($sql,$link);
      while($rows=mysql_fetch_assoc($rs)){
        if(intval($rows['level'])==4  && $rows['type']=='item')
        $exp=$exp+32500;
        if(intval($rows['level'])==3  && $rows['type']=='item')
        $exp=$exp+10800;
        if(intval($rows['level'])==2  && $rows['type']=='item')
        $exp=$exp+3600;
        if(intval($rows['level'])==1  && $rows['type']=='item')
        $exp=$exp+1200;
        if(intval($rows['level'])==5  && $rows['type']=='servent')
        $exp=$exp+32500*10;
        if(intval($rows['level'])==4  && $rows['type']=='servent')
        $exp=$exp+32500*2;
        if(intval($rows['level'])==3  && $rows['type']=='servent')
        $exp=$exp+10800*1.5;
        if(intval($rows['level'])==2  && $rows['type']=='servent')
        $exp=$exp+3600*1.5;
        if(intval($rows['level'])==1  && $rows['type']=='servent')
        $exp=$exp+1200*2;
      }
      if($rs==false){
        $rebool=false;
      }
      //删除经验卡
      $sql="DELETE FROM `myitem` WHERE userid=$id and id=$value;";
      $rs=mysql_query($sql,$link);
      if($rs==false){
        $rebool=false;
      }
    }
    //echo "exp:".$exp."\n";
    //更新servent的exp状态
    $sql="SELECT exp from myitem where userid=$id and id=$servent_id;";
    //echo $sql."\n";
    $rs=mysql_query($sql,$link);
    while($rows=mysql_fetch_assoc($rs)){
      $exp=$exp+(float)$rows['exp'];
    }
    //echo "exp:".$exp."\n";
    if($rs==false){
      $rebool=false;
    }
    $sql="UPDATE `myitem` SET  exp='$exp' where userid=$id and id=$servent_id;";
    //echo $sql."\n";
    $rs=mysql_query($sql,$link);
    if($rs==false){
      $rebool=false;
    }
    echo $rebool;
  }else{
    echo "登录状态异常";
  }
}
function get_servent()
{
	    require("include/global.php");
      mysql_query("SET NAMES UTF8");
      mysql_query("set character_set_client=utf8");
      mysql_query("set character_set_results=utf8");
      $un=$_POST['user'];
      $sql = "Select id from user where user='$un';";
      $rs=mysql_query($sql,$link);

      if(mysql_num_rows($rs)>=1)
			{
        $id=0;
      	while($rows=mysql_fetch_assoc($rs))
      	{
          $id=$rows['id'];
        }
              $sql="SELECT myitem.id as id,myitem.itemid as itemid,myitem.exp as exp,myitem.date as date,myitem.work as work, tj.name as name, tj.level as level, tj.strength as strength, tj.class as class FROM `myitem` INNER JOIN tj ON (myitem.itemid = tj.id) where myitem.userid=$id and myitem.work=0 and myitem.sold=0 and tj.type='servent' order by level desc;";
        			$rs=mysql_query($sql,$link);
        			if(mysql_num_rows($rs)>=1)
        			{
                $i=0;
              	while($rows=mysql_fetch_assoc($rs))
              	{
                    $result['name'.$i]=$rows['name'];
                		$result['level'.$i]=$rows['level'];
                		$result['strength'.$i]=$rows['strength'];
                    $result['class'.$i]=$rows['class'];
              		  $result['id'.$i]=$rows['id'];//MyitemId
                    $result['work'.$i]=$rows['work'];
                    //exp换算等级
                    $result['exp'.$i]=exp_level((float)$rows['exp']);
                    $result['allexp'.$i]=$rows['exp'];
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
function get_item()
{
	    require("include/global.php");
      mysql_query("SET NAMES UTF8");
      mysql_query("set character_set_client=utf8");
      mysql_query("set character_set_results=utf8");
      $un=$_POST['user'];
      $sql = "Select id from user where user='$un';";
      $rs=mysql_query($sql,$link);

      if(mysql_num_rows($rs)>=1)
			{
        $id=0;
      	while($rows=mysql_fetch_assoc($rs))
      	{
          $id=$rows['id'];
        }
              $sql="SELECT myitem.id as id,myitem.itemid as itemid,myitem.exp as exp,myitem.date as date,myitem.work as work,tj.type as type,tj.name as name, tj.level as level, tj.strength as strength, tj.class as class FROM `myitem` INNER JOIN tj ON (myitem.itemid = tj.id) where myitem.userid=$id and myitem.work=0 and myitem.sold=0 and myitem.exp=0 order by level desc;";
        			$rs=mysql_query($sql,$link);
        			if(mysql_num_rows($rs)>=1)
        			{
                $i=0;
              	while($rows=mysql_fetch_assoc($rs))
              	{

                    $result['name'.$i]=$rows['name'];
                		$result['level'.$i]=$rows['level'];
                		$result['strength'.$i]=$rows['strength'];
                    $result['class'.$i]=$rows['class'];
              		  $result['id'.$i]=$rows['id'];//MyitemId
                    $result['work'.$i]=$rows['work'];
                    $result['type'.$i]=$rows['type'];
                    //exp换算等级
                    $result['exp'.$i]=$rows['exp'];
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
