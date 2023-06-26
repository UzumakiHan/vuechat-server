/**
 * 聊天记录相关的内容
 */

"use strict";

const express = require('express');
const router = express.Router();
const models = require('../db')
const multiparty = require('multiparty');
const NET_URL = 'http://43.142.90.39/11112';
const multer = require('multer');
const fs = require('fs')
//const chatImgUpload = multer({ dest: 'chatImgUpload/' })
const createFolder = function (folder) {
    try {
        fs.accessSync(folder)
    } catch (e) {
        fs.mkdirSync(folder)
    }
}
const uploadVoiceFolder = './chatVoiceUpload/'
createFolder(uploadVoiceFolder)
// 通过 filename 属性定制
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadVoiceFolder) // 保存的路径
    },
    filename: function (req, file, cb) {
        // console.log(file)
        cb(null, file)
        // 将保存文件名设置为 字段名 + 时间戳 + 后缀名
        // let fileFormat = (file.originalname).split('.');
        // console.log(fileFormat[fileFormat.length - 1])
        // cb(null, file.fieldname + '-' + Date.now() + '.' + fileFormat[fileFormat.length - 1])
    }
})
const chatVoiceUpload = multer({ storage: storage })

//获取私聊的聊天记录
router.post('/digtalChatList', (req, res) => {
  
    const page = Number(req.body.page) - 1;
    const pageSize = Number(req.body.pageSize)
    const { sendAccountId, targetAccountId } = req.body;
    const sendAccountAndTargetAccountId = sendAccountId + targetAccountId;
    models.ChatListDital.find({sendAccountAndTargetAccountId}).skip(page * pageSize).limit(pageSize).sort({ 'chatTime': 1 }).exec((err,data)=>{
        if (err) throw err;
        if (data) {
            // console.log(data)
            res.json({
                status: 2,
                message: '聊天内容获取成功',
                data:{
                    chatDigtalList:data
                }
            })
        } 
    })
});

//获取首页的聊天列表（私聊）
router.post('/alldigtalChatList', (req, res) => {
    const { id } = req.body;
    const chatList = []
    models.User.findById(id, (err, data) => {
        if (err) throw err;
        if (data) {
            const friendsList = data.friendsList;
            // console.log(data)
            let friendsListLength = friendsList.length;
            if (friendsListLength > 0) {
                friendsList.forEach(friendid => {
                    const sendAccountAndTargetAccountId = id + friendid;
                    models.ChatListDital.find({sendAccountAndTargetAccountId})
                    .limit(1)
                    .sort({ 'chatTime': -1 })
                    .exec((err1,data1)=>{
                        if(err1) throw err1;
                        chatList.push(...data1);
                        friendsListLength--;
                        if (friendsListLength === 0) {
                            res.json({
                                status: 2,
                                message: '聊天内容获取成功',
                                data: {
                                    chatDigtalList: chatList
                                }
                            })
                        }
                        
                    })
                })
            } else {
                res.json({
                    status: 2,
                    message: '聊天内容获取成功',
                    data:{
                        chatDigtalList: []
                    }
                    
                })
            }

        }
    })
})


//清除私聊聊天记录
router.post('/cleanChatMessage', (req, res) => {

    const { id } = req.body;
    // console.log(id)
    models.ChatListDital.deleteMany({
        sendAccountAndTargetAccountId: id
    }, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                message: '清除聊天记录成功',
                data:{}
            })
        } else {
            res.json({
                status: 1,
                message: '清除聊天记录失败',
                data:{}
            })
        }
    })

})

router.post('/uploadChatVoice', (req, res, next) => {

    const form = new multiparty.Form();

    form.uploadDir = 'chatVoiceUpload';
    form.parse(req, (err, fields, files) => {
        // console.log(files, fields)
        const chatVoiceUrl = NET_URL + files.chatVoice[0].path.replace(/\\/g, "/");
        const chatVoiceTime = fields.voiceTime[0]
        // console.log(chatVoiceUrl)
        if (chatVoiceUrl) {
            res.json({
                status: 2,
                message:'success',
                data:{
                    chatVoiceMsg: {
                        chatVoiceTime,
                        chatVoiceUrl,
                    }
                }
                
            })
        } else {
            res.json({
                status: 1,
                message:'fail',
                data:{
                    chatVoiceMsg: {
                        chatVoiceTime: "",
                        chatVoiceUrl: ""
                    }
                }
            })
        }
        //console.log(files)

    })


})

//获取群聊聊天记录
router.post('/myGroupChatMsg',(req,res)=>{

    const { sendAccountAndchatRoomId } = req.body;
    const page = Number(req.body.page) - 1;
    const pageSize = Number(req.body.pageSize)

  models.chatGroupList.find({sendAccountAndchatRoomId}).skip(page * pageSize).limit(pageSize).sort({ 'chatTime': 1 }).exec((err,data)=>{
      if (err) throw err;
      if (data) {
         
          res.json({
              status: 2,
              data:{
                groupChatList:data
              },
              message: '获取聊天记录成功',
          })
      } 
  })

});
//清除群聊聊天记录
router.post('/cleanChatList', (req, res) => {
    const { sendAccountAndchatRoomId } = req.body;
    // console.log(sendAccountAndchatRoomId)
    models.chatGroupList.deleteMany({
        sendAccountAndchatRoomId
    }, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                message: '删除聊天记录成功',
                data:{}
            })
        } else {
            res.json({
                status: 2,
                message: '删除聊天记录失败',
                data:{}
            })
        }
    })
});
//获取首页聊天列表（群聊）
router.post('/allgrounpChatList', (req, res) => {
    const { id } = req.body;
    // console.log(id)
    models.User.findById(id, (err, data) => {
        if (err) throw err;
        if (data) {
            const chatRooms = data.chatRooms;
            let chatRoomsLength = chatRooms.length;
            const allGrounpChatList = []
            if (chatRoomsLength > 0) {
                chatRooms.forEach(chatRoomId => {
                    models.chatGroupList.find({chatRoomId}).limit(1)
                    .sort({ 'chatTime': -1 }).exec((err1,data1)=>{
                        if (err1) throw err1;
                        allGrounpChatList.push(...data1);
                        chatRoomsLength--;
                        if (chatRoomsLength === 0) {
                            res.json({
                                status: 2,
                                data:allGrounpChatList,
                                message:'success',
                            })
                        }
                    })
                })
            } else {
                res.json({
                    status: 2,
                    data:{
                        allGrounpChatList: []
                    },
                    message:'success',
                   
                })
            }
        }
    })
})

module.exports = router;