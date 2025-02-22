const express = require('express');
const config = require('./config/default');
const app = express()
const PORT = config.api.PORT;
const {
    Sequelize,
    DataTypes
} = require("sequelize");
const bodyParser = require("body-parser");
var jwt = require('jsonwebtoken');
const cors = require('cors')
const cookieparser = require('cookie-parser');
const router = require('./test');
const bcrypt = require('bcrypt');
const router2=require('./program');
const cookieParser = require('cookie-parser');

app.use(cors({
    credentials: true,
}));
app.set('view engine', 'ejs');
app.use(cookieparser())
app.use(express.json());
app.use(router)
app.use(router2)
app.use(cookieParser());



const sequelize = new Sequelize(
    'jwt',
    'root',
    '1234', {
        host: 'localhost',
        dialect: 'mysql',
        logging: false,
    },
);

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((error) => {
    console.error('Unable to connect to the database: ', error);
});

const register = sequelize.define('register', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }

}, {
    sequelize,
    tableName: 'register',
    timestamps: true,
    createdAt: "created_at", // alias createdAt as created_at
    updatedAt: "updated_at",
    indexes: [{
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{
            name: "id"
        }, ]
    }, ]
});

const todo = sequelize.define('todo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title:{
        type: DataTypes.STRING,
        allowNull: false
    },
    auther:{
        type: DataTypes.STRING,
        allowNull: false
    },
    image:{
        type: DataTypes.TEXT,
        allowNull: false
    },
    content:{
        type: DataTypes.TEXT,
        allowNull: false
    },
    // user_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false
    // },
}, {
    sequelize,
    tableName: 'todo',
    timestamps: true,
    createdAt: "created_at", // alias createdAt as created_at
    updatedAt: "updated_at",
    indexes: [{
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{
            name: "id"
        }, ]
    }, ]
});


sequelize.sync().then(() => {
    console.log('Book table created successfully!');
}).catch((error) => {
    console.error('Unable to create table : ', error);
});

app.post('/postRegister', async (req, res) => {
    try {
        if (req.body.email) {
            const findEmail = await register.findOne({
                where: {
                    email: req.body.email
                }
            })
            if (findEmail) {
                res.json({
                    status: 400,
                    message: 'Email already exists'
                })
            } else {
                await bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        console.log('error occured in password hashing:', err.message)
                    } else {

                        const Register = register.create({
                            username: req.body.username,
                            email: req.body.email,
                            password: hash
                        })
                        if (Register) {
                            res.status(200).json({
                                status: 200,
                                data: Register

                            })
                        } else {
                            res.json({
                                status: 400,
                                message: 'Unable to register'
                            })
                        }
                    }
                })

            }
        }

    } catch (error) {
        console.log("error is ", error)
    }

})

app.post('/login', async (req, res) => {

    try {

        const data = await register.findOne({
            where: {
                email: req.body.email,
            }
        })
        const id=data.id
        if (!data) {
            res.json({
                status: 400,
                message: 'Unable to login'
            })
        } else {
            const result=await bcrypt.compare(req.body.password, data.password)
               if(result){
                    jwt.sign({id}, "secretkey", {expiresIn: '2h'},(err, token) => {
                        if (token) {
                            req.user = data.id
                            const userId = req.user
                            console.log(userId)
                            module.exports.userId = userId
                            res.json({
                                status: 200,
                                data: token
                            })
                        } else {
                            res.json({
                                status: 401,
                                message: 'Unauthorized'
                            })
                        }
                  /* Creating a new token. */
                    })
                    const refreshToken = jwt.sign({id}, "refreshsecretkey", { expiresIn: '1d' });
                    console.log("refreshToken:",refreshToken)
                    res.cookie('refjwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
                    console.log(req.cookie)
                    console.log(req.cookies)
                }else{
                    res.json({
                        status: 401,
                        message: 'Unauthorized'
                    })
                }
            }
            
        
    } catch (err) {
        console.log('Unable to Login', err.message)
    }

    // try{
    //     const loginData=await register.findOne({
    //         where:{
    //             email:req.body.email,
    //             password: req.body.password 
    //         }})
    //         if(loginData){
    //             const accessToken=jwt.sign({loginData},"accessSecretkey",{expiresIn:'3m'});
    //             const reffreshToken=jwt.sign({loginData},"refreshSecretkey",{expiresIn:'1d'});
    //             res.cookie('jwt',reffreshToken,{ httpOnly: true, 
    //                 sameSite: 'None', secure: true, 
    //                 maxAge: 24 * 60 * 60 * 1000 })

    //              res.json({
    //                     status:200,
    //                     data:accessToken,
    //                     cookie:reffreshToken
    //                 })

    //         }else{
    //             res.json({'stasus':406,
    //             message: 'Invalid credentials' });
    //         }
    // }catch(error){
    //     console.log("error is /login", error.message)
    // }

})


app.get('/read-cookie', (req, res) => {
    const myCookie = req.cookies['refjwt'];
    console.log(myCookie)
   res.json({
    data:req.cookies['refjwt']
   })
  });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

module.exports.todo = todo
module.exports.register = register