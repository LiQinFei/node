
const router = require('koa-router')()
const mysql = require('mysql');
const wrapper = require('co-mysql');
const images = require("images");
 const fs = require('fs');
const datas = require('../bin/datas.js')
const options = {
    host : 'localhost',
    port : 3306 ,
    database : 'yule',
    user: 'root',
    password : '123456'
};

var pool = mysql.createPool(options),
  db = wrapper(pool);

 //登录
router.post('/login', async (ctx, next) => {
 	 var data = ctx.request.body 
 	 var  username = data.username
	 var password = data.password


	 try {
	 	// statements
	 	 var user = await db.query(`SELECT * FROM user_table WHERE name='${username}'`)
		 	 if(user.length >0){
		 	 	if(user[0].password == password){

		 	 		ctx.body = {user_id:user[0].ID,msg:'登录成功',status:'1',name:user[0].name}
		 			
		 	 	}else {
		 	 		ctx.body = {msg:'密码错误',status:'-1'}
		 	 	}
			 }else {
			 	ctx.body = {msg:'用户名不存在',status:'0'}
			 }
	 	
	 } catch(e) {
	 	// statements
	 	console.log(e);
	 }
	 
	 	
})


//注册
router.post('/register', async (ctx, next) => {
 	 var data = ctx.request.body 
 	 var username = data.username
	 var password = data.password
     var email = data.email
     var phone = data.phone
     var birthday = data.birthday

 	 	 var user = await db.query(`SELECT * FROM user_table WHERE name='${username}'`)
 	 	 if(user.length >0){
 	 	 	ctx.body = { msg:'用户名已存在',status:'0'}
 	 	 }else {
 	 	 	try {
 	 	 		// statements
	 	 	   await db.query(`INSERT INTO user_table (name,password,email,phone,birthday) VALUES('${username}','${password}','${email}','${phone}','${birthday}')`)
	 	 		ctx.body = { msg:'注册成功',status:'1'}
 	 	 	} catch(e) {
 	 	 		// statements
 	 	 		console.log(e);
 	 	 	}	
 	 }
})

//获取用户信息
router.post('/getUser', async (ctx, next) => {

 	 var data = ctx.request.body 
 	 var  user_id = data.user_id
	 try {
	 	// statements
	 	 var user = await db.query(`SELECT * FROM user_table WHERE ID='${user_id}'`)
		 	 if(user.length >0){
		 	 		if(user[0].src == null){
		 	 			var usersrc = 'images/moren.jpg'
		 	 		}else {
		 	 			var usersrc = 'images/'+user[0].src
		 	 		}

		 	 		ctx.body = {username:user[0].name,usersrc:usersrc,email:user[0].email,phone:user[0].phone,birthday:user[0].birthday}
			 }
	 } catch(e) {
	 	// statements
	 	console.log(e);
	 } 	
})
//上传图片
router.post('/upsrc', async (ctx, next) => {
 	 var data = ctx.request.body 
 	 var  user_id = data.user_id
 	 var  srcUp = data.srcUp

 	 var nameImg = Date.now()+'.jpg'
     var path = __dirname+'/../public/images/'+ nameImg
        var base64 = srcUp.replace(/^data:image\/\w+;base64,/, "");//去掉图片base64码前面部分data:image/png;base64
        var dataBuffer = new Buffer(base64, 'base64'); //把base64码转成buffer对象，
         try {
            		// statements
            		 await images(dataBuffer).size(100).save(path, {quality : 100})
            		 var user = await db.query(`SELECT * FROM user_table WHERE ID='${user_id}'`)
            		await db.query(`UPDATE user_table SET src='${nameImg}' WHERE ID='${user_id}'`)
            		if(user[0].src){
            			await fs.unlink(__dirname+'/../public/images/'+user[0].src)	
    					ctx.body = {status:'1'}
            		}else {
            			ctx.body = {status:'1'}
            		}	
            	} catch(e) {
            		// statements
            		ctx.body = {status:'-1'}
            	}
})


//publish上传文章

router.post('/publish',async(ctx,next)=>{
	var data = ctx.request.body 
	var title = data.title
	var introduction = data.introduction
	var content = data.content
	var user_id = data.user_id
 	var  src = data.src
 	var dataNow = datas.getNowFormatDate()
	console.log(title  +'/' +introduction +'/'+ content )




 	 var nameImg = Date.now()+'.jpg'
     var path = __dirname+'/../public/images/'+ nameImg
        var base64 = src.replace(/^data:image\/\w+;base64,/, "");//去掉图片base64码前面部分data:image/png;base64
        var dataBuffer = new Buffer(base64, 'base64'); //把base64码转成buffer对象，
         try {
            		// statements
            		 await images(dataBuffer).size(100).save(path, {quality : 100})
            		 var user = await db.query(`SELECT * FROM user_table WHERE ID='${user_id}'`)
            		 await db.query(`INSERT INTO share_table (name,title,introduction,content,data,src) VALUES('${user[0].name}','${title}','${introduction}','${content}','${dataNow}','${nameImg}')`)
            			
            			ctx.body = {status:'1'}
            		
            	} catch(e) {
            		// statements
            		ctx.body = {status:'-1'}
            	}
})


		//获取list 列表
		router.get('/getlist',async(ctx,text)=>{
				 var list = await db.query(`SELECT ID,name,title,introduction,data,src FROM share_table`)
				 ctx.body = list
		})
		//获取list 详情

		router.post('/textdetail',async(ctx,text)=>{
				var id = ctx.request.body.user_id.id
			
				
			 var list = await db.query(`SELECT name,title,introduction,content,data FROM share_table WHERE ID='${id}'`)
			 ctx.body = list
	})
		//获取 个人列表 

		router.post('/userlist',async(ctx,text)=>{
				var name = ctx.request.body.name
				
			  var list = await db.query(`SELECT ID,title,data,src FROM share_table WHERE name='${name}'`)
			  ctx.body = list
	})
			//删除个人列表

		router.post('/dellist',async(ctx,text)=>{
				var id = ctx.request.body.id
				try {
					// statements
					var user = await db.query(`SELECT * FROM share_table WHERE ID='${id}'`)
					await fs.unlink(__dirname+'/../public/images/'+user[0].src)	
					 await db.query(`DELETE FROM share_table WHERE ID='${id}'`)
					 ctx.body = {status:'1'}
				} catch(e) {
					// statements
					console.log(e);
				}
			  
			  
	})
		
module.exports = router
