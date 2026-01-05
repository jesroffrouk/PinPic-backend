import { Server } from 'socket.io';
import cookie from 'cookie'
import jwt from 'jsonwebtoken'
import { sendPendingNotifications } from './services/notificationService.js';

let io = null;

export function init(server) {
    io = new Server(server,{
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true,
        }
    })
    
    io.use((socket,next)=>{
    
    const cookies = cookie.parse(socket.handshake.headers.cookie || "")
    const token = cookies.token

    if(!token) {
        return next(new Error("No token found"))
    }
    const secretkey = process.env.JWT_SECRET_KEY
    try {
    const {id,username,email} = jwt.verify(token,secretkey)
    socket.user = {
        id,
        username,
        email 
    }
    socket.join(socket.user.id) 
    next() 
    } catch (error) {
    next(new Error('Authentication error')) 
    }
    })

    io.on("connection", async(socket) => {
    console.log("Client connected:", socket.user.id);
    sendPendingNotifications(socket.user.id)
    });
    return io
}

export function getIO(){
    if (!io){
        throw new Error('socket not initialized')
    }
    return io
}
