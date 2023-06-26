/**
 * 群聊相关的路由
 */

"use strict";

const express = require('express');
const router = express.Router();
const models = require('../db')
const multiparty = require('multiparty');
const NET_URL = 'http://43.142.90.39/11112/';

//创建群聊
router.post('/createChatRoom', (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        // console.log(files, fields);
        const chatRoomMemberId = JSON.parse(fields.chatRoomMemberId[0]);
        // console.log(chatRoomMemberId)
        let chatRoomMemberIdLength = chatRoomMemberId.length;
        const chatRoomImg = fields.chatRoomImg[0];
        const chatRoomOwner = fields.chatRoomOwner[0];

        models.chatRoom.create({
            chatRoomMemberId, chatRoomImg, chatRoomOwner
        }, (err, data) => {
            if (err) throw err;
            if (data) {
                const chatRoomMemberIds = data.chatRoomMemberId;
                const chatRoomId = data._id
                // console.log(String(chatRoomId))
                chatRoomMemberIds.forEach(chatRoomMember => {
                    models.User.updateOne({ _id: chatRoomMember }, {
                        $push: { chatRooms: String(chatRoomId) }
                        //  chatRooms:[]
                    }, (err1, data1) => {
                        if (err1) throw err1;
                        chatRoomMemberIdLength--;
                        if (chatRoomMemberIdLength === 0) {
                            res.json({
                                status: 2,
                                message: '创建成功',
                                data:{}
                            })
                        }
                    })


                })
            }
        })

    })

});
//我的群聊
router.post('/myChatRoom', (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        
        const chatRoomIdArr = JSON.parse(fields.chatRoomIdArr[0]);
     
        let chatRoomIdArrLength = chatRoomIdArr.length;
        console.log(chatRoomIdArrLength)
        if(chatRoomIdArrLength === 0){
            res.json({
                status: 2,
                message:'success',
                data:[]
            })
        }else{
            const allMyChatRoom = []
            chatRoomIdArr.forEach(chatRoomId => {
                models.chatRoom.findById(chatRoomId, (err, data) => {
                    if (err) throw err;
                    if (data) {
                        chatRoomIdArrLength--;
                        allMyChatRoom.push(data);
                        if (chatRoomIdArrLength === 0) {
                            res.json({
                                status: 2,
                                message:'success',
                                data:allMyChatRoom
                            })
                        }
                    }
                })
            })
        }
       
    })


});
//更改群昵称
router.post('/editChatRoomName', (req, res) => {
    // console.log(req.body.id);
    const { id, chatRoomName } = req.body;
    console.log(id, chatRoomName);
    models.chatRoom.updateOne({
        _id: id
    }, {
        chatRoomName
    }, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                message: '修改成功',
                data,
               
            })
        } else {
            res.json({
                status: 1,
                message: '修改失败',
                data:{}
            })
        }
    })


});
//更改群公告
router.post('/editChatRoomAd', (req, res) => {
    // console.log(req.body.id);
    const { id, chatRoomAd } = req.body;
    // console.log(id, chatRoomAd);
    models.chatRoom.updateOne({
        _id: id
    }, {
        chatRoomAd
    }, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                message: '修改成功',
                data:{}
            })
        } else {
            res.json({
                status: 1,
                message: '修改失败',
                data:{}
            })
        }
    })


});

//添加群成员
router.post('/addChatMember', (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        const chatRoomMemberId = JSON.parse(fields.chatRoomMemberId[0]);
        const selectResultIds = JSON.parse(fields.selectResultIds[0]);
        let chatRoomMemberIdLength = selectResultIds.length;
        const id = fields.chatRoomId[0];
        models.chatRoom.updateOne({
            _id: id
        }, { chatRoomMemberId }, (err, data) => {
            if (err) throw err;
            selectResultIds.forEach(chatRoomMember => {
                models.User.updateOne({ _id: chatRoomMember }, {
                    $push: { chatRooms: id }
                    // chatRooms:[]
                }, (err1, data1) => {
                    if (err1) throw err1;
                    chatRoomMemberIdLength--;
                    if (chatRoomMemberIdLength === 0) {
                        res.json({
                            status: 2,
                            message: '添加群成员成功',
                            data:{}
                        })
                    }
                })


            })
            // if(data){
            //     res.json({
            //         status:2,
            //         message:'添加群成员成功'
            //     })
            // }else{
            //     res.json({
            //         status:1,
            //         message:'添加群成员失败'
            //     })
            // }
        })
        // console.log(chatRoomMemberId);
        // res.json({
        //     status:2
        // })
    })
})
//获取聊天室
router.post('/getChatRoomInfo', (req, res) => {
    const { id } = req.body;
    models.chatRoom.findById(id, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                message: '获取聊天室成功',
                data
            });
        } else {
            res.json({
                status: 1,
                message: '获取聊天室失败',
                data:{}
            });
        }
    })
});
//移除群成员
router.post('/removeChatMember', (req, res) => {
    const { chatRoomId, removeChatId } = req.body;
    // console.log(chatRoomId)
    const sendAccountAndchatRoomId = removeChatId + chatRoomId;
    models.User.updateOne({
        _id: removeChatId
    }, {
        $pull: { chatRooms: chatRoomId }
    }, (err1, data1) => {
        if (err1) throw err1;
        if (data1) {
            models.chatRoom.updateOne({
                _id: chatRoomId
            }, { $pull: { chatRoomMemberId: removeChatId } }, (err, data) => {
                if (err) throw err;
                if (data) {
                    models.chatGroupList.deleteMany({
                        sendAccountAndchatRoomId
                    }, (err2, data2) => {
                        if (err2) throw err2;
                        if (data2) {
                            res.json({
                                status: 2,
                                message: '移除成功',
                                data:{}
                            })
                        } else {
                            res.json({
                                status: 1,
                                message: '移除失败',
                                data:{}
                            })
                        }

                    })
                }
            })

        }
    })

});
//删除退出群聊(群主自己退出)
router.post('/deleteChatOwner', (req, res) => {
    const { chatRoomId, removeChatId, newChatRoomOwner } = req.body;
    // console.log(chatRoomId, removeChatId, newChatRoomOwner)
    const sendAccountAndchatRoomId = removeChatId + chatRoomId;
    models.User.updateOne({
        _id: removeChatId
    }, {
        $pull: { chatRooms: chatRoomId }
    }, (err1, data1) => {
        if (err1) throw err1;
        if (data1) {
            models.chatRoom.updateOne({
                _id: chatRoomId
            }, { $pull: { chatRoomMemberId: removeChatId } }, (err, data) => {
                if (err) throw err;
                if (data) {
                    models.chatRoom.updateOne({
                        _id: chatRoomId
                    }, {
                        chatRoomOwner: newChatRoomOwner
                    }, (err3, data3) => {
                        if (err3) throw err3;
                        if (data3) {
                            models.chatGroupList.deleteMany({
                                sendAccountAndchatRoomId
                            }, (err2, data2) => {
                                if (err2) throw err2;
                                if (data2) {
                                    res.json({
                                        status: 2,
                                        message: '退出群组成功',
                                        data:{}
                                    })
                                } else {
                                    res.json({
                                        status: 1,
                                        message: '退出群组失败',
                                        data:{}
                                    })
                                }

                            })
                        }
                    })

                }
            })

        }
    })

})









module.exports = router;