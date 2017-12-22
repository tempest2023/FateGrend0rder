<?php
header("Content-type: text/html; charset=utf-8");
if ($_POST['inf']=='get')
{get_jy_data();}
if($_POST['inf']=='add')
{add_jy_data();}
if ($_POST['inf']=='get_sell_servent')
{get_sell_servent_data();}
if ($_POST['inf']=='get_sold_servent')
{get_sold_servent_data();}
if ($_POST['inf']=='del')
{del_jy_data();}
if ($_POST['inf']=='buy')
{buy();}
function buy(){
  require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $user=$_POST['user'];
  $jyid=$_POST['jyid'];//买的商品的id
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    $flag=true;
    //获取商品售卖的price,userid,myitemid
    $sql="select * from jy where id=$jyid;";
    $rs=mysql_query($sql,$link);
    while ($rows=mysql_fetch_assoc($rs)) {
      $recpid=$rows['userid'];
      $itemid=$rows['myitemid'];
      $price=$rows['price'];
    }
    //查询卖家的钱
    $sql="select blocknum from user where id=$recpid;";
    echo $sql."\n";
    $rs=mysql_query($sql,$link);
    while ($rows=mysql_fetch_assoc($rs)) {
      $blocknum1=$rows['blocknum'];
    }
    //查询卖家的钱
    $sql="select blocknum from user where id=$id;";
    $rs=mysql_query($sql,$link);
    while ($rows=mysql_fetch_assoc($rs)) {
      $blocknum2=$rows['blocknum'];
    }
    //买家有足够的钱进行交易
    if($blocknum2>=$price)
    {
      $blocknum1=intval($blocknum1)+intval($price);
      $blocknum2=intval($blocknum2)-intval($price);
      $sql="UPDATE `user` SET `blocknum`=$blocknum1 WHERE id=$recpid;";
      $rs=mysql_query($sql,$link);
      if(!$rs){
        $flag=false;
      }else{
        $sql="UPDATE `user` SET `blocknum`=$blocknum2 WHERE id=$id;";
        $rs=mysql_query($sql,$link);
        if(!$rs){
          $flag=false;
        }else{
          //更新item的所属人
          $sql="UPDATE `myitem` SET `userid`=$id,`sold`=0 WHERE id=$itemid;";
          $rs=mysql_query($sql,$link);
          //删除这项交易
          $sql="DELETE FROM `jy` WHERE id=$jyid;";
          $rs=mysql_query($sql,$link);
          if(!$rs){
            $flag=false;
          }
          echo $flag;
        }
      }
    }
  }
  else{
    echo "用户登录异常";
  }
}
function del_jy_data(){
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
    $itemid=$_POST['itemid'];//myitem列表里的id
    //判断是否在售卖并取消售卖
    $sql="UPDATE `myitem` SET `sold`=0 WHERE id=$itemid;";
    $rs=mysql_query($sql,$link);
    $sql="DELETE FROM `jy` WHERE myitemid=$itemid;";
    $rs2=mysql_query($sql,$link);
    if($rs&&$rs2)
    {
      echo true;
    }
    else{
      echo "false";
    }
  }
    else{
      echo "用户登录异常";
    }
}
function get_sold_servent_data(){
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
      $sql="SELECT myitem.id as id,myitem.itemid as itemid,myitem.exp as exp,myitem.date as date,myitem.work as work, tj.name as name, tj.level as level, tj.strength as strength, tj.class as class FROM `myitem` INNER JOIN tj ON (myitem.itemid = tj.id) where myitem.userid=$id and myitem.work=0 and myitem.sold=1 and tj.type='servent' and myitem.userid=$id order by exp+0 desc;";
      $rs=mysql_query($sql,$link);
      $i=0;
      $result=array();
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
    }
    else{
      echo "用户登录异常";
    }
  }
function get_sell_servent_data(){
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
    $sql="SELECT myitem.id as id,myitem.itemid as itemid,myitem.exp as exp,myitem.date as date,myitem.work as work, tj.name as name, tj.level as level, tj.strength as strength, tj.class as class FROM `myitem` INNER JOIN tj ON (myitem.itemid = tj.id) where myitem.userid=$id and myitem.work=0 and myitem.sold=0 and tj.type='servent' order by exp+0 desc;";
    $rs=mysql_query($sql,$link);
    $i=0;
    $result=array();
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
  }
  else{
    echo "用户登录异常";
  }
}
function add_jy_data(){
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
    $itemid=$_POST['itemid'];//myitem列表里的id
    $price=$_POST['price'];
    //判断是否在打工并添加售卖
    $sql="UPDATE `myitem` SET `sold`=1 WHERE work=0 and id=$itemid;";
    $rs=mysql_query($sql,$link);
    if($rs)
    {
      $sql="select * from jy where myitemid=$itemid;";
      $result = mysql_query($sql,$link);
      $item_jy_num=0;
      while($rows=mysql_fetch_assoc($result)){
        $item_jy_num++;
      }
      //不重复添加
      if($item_jy_num==0)
      {
        $sql="INSERT INTO `jy`(`id`, `userid`, `myitemid`, `price`) VALUES (null,$id,$itemid,$price);";
        $rs=mysql_query($sql,$link);
        if($rs)
        {echo true;}
        else{
          echo "false";
        }
      }else {
        echo "false";
      }
    }
    else{
      echo "false";
    }
  }
    else{
      echo "用户登录异常";
    }
}
function get_jy_data(){
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
    $sql="select * from jy order by id desc;";
    $rs=mysql_query($sql,$link);
    $i=0;
    $re=array();
    while($rows=mysql_fetch_assoc($rs)){
      $re['id'.$i]=$rows['id'];
      $re['userid'.$i]=$rows['userid'];
      $re['myitemid'.$i]=$rows['myitemid'];
      $re['price'.$i]=$rows['price'];
      $userid=$rows['userid'];
      $itemid=$rows['myitemid'];
      $sql="SELECT myitem.id as id,myitem.itemid as itemid,myitem.exp as exp,myitem.date as date,myitem.work as work, tj.name as name, tj.level as level, tj.strength as strength, tj.class as class FROM `myitem` INNER JOIN tj ON (myitem.itemid = tj.id) where myitem.id=$itemid;";
      $rs2=mysql_query($sql,$link);
      while($rows2=mysql_fetch_assoc($rs2)){
        $re['name'.$i]=$rows2['name'];
        $re['level'.$i]=$rows2['level'];
        $re['strength'.$i]=$rows2['strength'];
        $re['class'.$i]=$rows2['class'];
        //exp换算等级
        $re['exp'.$i]=exp_level((float)$rows2['exp']);
        $re['allexp'.$i]=$rows2['exp'];
        $re['date'.$i]=$rows2['date'];
        $re['itemid'.$i]=$rows2['itemid'];//Myitem 里的itmeid即图鉴id
      }
      $sql="select user from user where id=$userid;";
      $rs3=mysql_query($sql,$link);
      while($rows3=mysql_fetch_assoc($rs3)){
        $re['user'.$i]=$rows3['user'];
      }
      $i++;
    }
    $re["length"]=$i;
    if($rs)
    {
      echo json_encode($re);
    }else{
      echo "服务器繁忙";
    }
  }else{
    echo "用户登录异常";
  }
}
/****************************计算函数*************************************/
function mine_percent($x,$rare)
{
  //根据英灵稀有度返回挖矿效率
  switch(intval($rare))
  {
    case 1:
    return logistic($x,0.8,0.1,0.01);
    break;
    case 2:
    return logistic($x,0.8,0.1,0.015);
    break;
    case 3:
    return logistic($x,0.8,0.1,0.02);
    break;
    case 4:
    return logistic($x,0.8,0.1,0.03);
    break;
    case 5:
    return logistic($x,0.8,0.1,0.05);
    break;
  }
}
function logistic($x,$k,$r,$p0)
{
  //logistic函数,给定不同的K,r,P0参数和X的值，返回y的值
  if(intval($x)>1000)
  {
    $x=exp_level($x);
  }
  return ($k*$p0)/($p0+($k-$p0)*(pow(2.71828,(-1*$r*$x))));
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
function exp_level($exp){
  $exp=intval($exp);
  //给总exp，返回等级
  $x=0;
  while($exp>level_exp($x))
  {
    $exp=$exp-level_exp($x);
    $x++;
  }
  return $x;
}
function price_dg_block($i){
  //$i是当前拥有的块
  //返回买下一个块需要多少钱
  return pow(2,$i-2)*300;
}
?>
