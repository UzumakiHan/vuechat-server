/**
 * 用户发表朋友圈的一些路由
 */
"use strict";
const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const models = require('../db')


//发表朋友圈
router.post('/publicMoment', (req, res) => {
    // console.log(req.body.wechatMoment)
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        const latitudeAndlongitude = JSON.parse(fields.latitudeAndlongitude[0])
        const userInfo = JSON.parse(fields.userInfo[0])
        const base64ImgListLength = Number(fields.base64ImgListLength[0]);
        const base64ImgList = [];
        for (let i = 0; i < base64ImgListLength; i++) {
            const base64ImgListIndex = `base64ImgList${i}`;
            base64ImgList.push(fields[base64ImgListIndex][0]);
        }

        const momentInfo = {
            vueChatId: fields.vueChatId[0],
            momentText: fields.momentText[0],
            base64ImgList: base64ImgList,
            location: fields.location[0],
            momentTime: fields.momentTime[0],
            latitudeAndlongitude: latitudeAndlongitude,
            userInfo
        }
        models.wechatMoment.create(momentInfo, (err, data) => {
            if (err) throw err;
            if (data) {
                res.json({
                    status: 2,
                    message: '发表成功',
                    data: {}
                })
            } else {
                res.json({
                    status: 1,
                    message: '发表失败',
                    data: {}
                })
            }
        })


    })

});
//获取好友们的朋友圈
router.post('/allFriendsWechatMoments', (req, res) => {
    const { id } = req.body;
    const page = Number(req.body.page) - 1;
    const pageSize = Number(req.body.pageSize)
    const allFriendsWechatMoments = []
    let allUserLength = 0
    models.User.findById(id, (err, data) => {
        if (err) throw err;
        if (data) {
            const friendsList = data.friendsList;

            friendsList.push(id);

            allUserLength = friendsList.length;
            friendsList.forEach(vuechatId => {
                models.wechatMoment.find({ vueChatId: vuechatId }).skip(page * pageSize).limit(pageSize).sort({ momentTime: -1 }).exec((err1, info) => {
                    if (err1) throw err1;

                    info.forEach(item => {
                        allFriendsWechatMoments.push(item);
                    })
                    allUserLength--;
                    if (allUserLength === 0) {
                        res.json({
                            status: 2,
                            data: {
                                list: allFriendsWechatMoments
                            },
                            message: 'success'
                        })
                    }

                });
            })
        }
    })
    // console.log(allUserLength)



});
//获取自己的朋友圈
router.post('/myWechatMoments', (req, res) => {
    const { id} = req.body;
    const page = Number(req.body.page) - 1;
    const pageSize = Number(req.body.pageSize)
    models.wechatMoment.find({ vueChatId: id }).skip(page * pageSize).limit(pageSize).sort({ momentTime: -1 }).exec((err, data) => {
        if (err) throw err;

        res.json({
            status: 2,
            data: {
                list: data
            },
            message: 'success'
        })

    });
});
//删除朋友圈
router.post('/delWechatMoment', (req, res) => {
    const { id } = req.body;
    models.wechatMoment.deleteOne({
        _id: id
    }, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                message: '删除成功',
                data: {}
            })
        } else {
            res.json({
                status: 1,
                message: '删除失败',
                data: {}

            })
        }
    })


});
//点赞朋友圈
router.post('/likeWechatMoment', (req, res) => {
    const { wechatMomentId, vuechatAccount } = req.body;
    models.wechatMoment.updateOne({
        _id: wechatMomentId
    }, {
        // likeAccounts:[]
        $push: { likeAccounts: vuechatAccount }
    }, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                message: '点赞成功',
                data: {}

            })
        } else {
            res.json({
                status: 1,
                message: '点赞失败',
                data: {}

            })
        }

    })
});
//取消点赞朋友圈
router.post('/unLikeWechatMoment', (req, res) => {
    const { wechatMomentId, vuechatAccount } = req.body;
    models.wechatMoment.updateOne({
        _id: wechatMomentId
    }, {
        // likeAccounts:[]
        $pull: { likeAccounts: vuechatAccount }
    }, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                data: {},
                message: '取消点赞成功'
            })
        } else {
            res.json({
                status: 1,
                data: {},
                message: '取消点赞失败'
            })
        }

    })
});
//评论朋友圈
router.post('/sendWechatComment', (req, res) => {
    console.log(req.body);
    const { wechatMomentId, receiveUser, sendUser, wechatComment, wechatCommentTime } = req.body;
    console.log(sendUser)
    const commentInfo = {

        wechatComment,
        wechatCommentTime,
        receiveUser: JSON.parse(receiveUser),
        sendUser: JSON.parse(sendUser)
    }
    models.wechatMoment.updateOne({
        _id: wechatMomentId
    }, {
        $push: { commentList: commentInfo }
    }, (err, data) => {
        if (err) throw err;
        if (data) {
            res.json({
                status: 2,
                data: {},
                message: '评论成功'
            })
        } else {
            res.json({
                status: 1,
                data: {},
                message: '评论失败'
            })
        }
    })
    // console.log(commentInfo);

});
/*
得到指定数组的分页信息对象
 */
function pageFilter(arr, pageNum, pageSize) {
    pageNum = pageNum * 1
    pageSize = pageSize * 1
    const total = arr.length
    const pages = Math.floor((total + pageSize - 1) / pageSize)
    const start = pageSize * (pageNum - 1)
    const end = start + pageSize <= total ? start + pageSize : total;
    const list = []
    for (let i = start; i < end; i++) {
        list.push(arr[i])
    }

    return {
        pageNum,
        total,
        pages,
        pageSize,
        list
    }
}
module.exports = router;