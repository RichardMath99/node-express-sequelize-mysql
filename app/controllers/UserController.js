const Yup = require('yup');
const User = require('../models/User');

class UserController {

    async index(req, res) {

        const users = await User.findAll({
            attributes: ['id', 'name', 'email']
        });

        return res.json(users);
    }

    async store(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string().email().required(),
            passBeforeHash: Yup.string().required().min(6)        
        });

        if(!(await schema.isValid(req.body))){
            return res.status(400).json({ error: 'Validation fails' });
        }

        const userExists = await User.findOne({ where: {email: req.body.email} });

        if(userExists){ return res.status(400).json({ error: 'User exists' }) }

        const { id, name, email } = await User.create(req.body);

        return res.json({ id, name, email });
    }

    async update(req, res){
        const schema = Yup.object().shape({
            name: Yup.string(),
            email: Yup.string().email(),
            oldPassword: Yup.string().min(6),
            passBeforeHash: Yup.string().min(6)
                .when('oldPassword', (oldPassword, field) => 
                    oldPassword ? field.required() : field
                ),
            confirmPassword: Yup.string().when('passBeforeHash', (passBeforeHash, field) => 
                passBeforeHash ? field.required().oneOf([Yup.ref('passBeforeHash')]) : field
            )
        });

        if(!(await schema.isValid(req.body))){
            return res.status(400).json({ error: 'Validation fails' });
        }

        const { email, oldPassword } = req.body;

        const user = await User.findByPk( req.userId );
        
        if(email && email !== user.email){
            const userExists = await User.findOne({ where: { email } });

            if(userExists){ return res.status(400).json({ error: 'Email already exists' }) }
        }

        if(oldPassword && !( await user.checkPassword(oldPassword) )){
            return res.status(401).json({ error: 'Old password does not match' })
        }

        const { id, name } = await user.update(req.body);
        
        return res.json({ id, name });
    }

}

module.exports = new UserController();