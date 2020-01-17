const axios = require('axios');
const Dev = require('../models/dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnection, senMessage } = require('../websocket');

module.exports = {
    async index(request, response){
        const devs = await Dev.find();
        return response.json(devs);
    },

    async store(request, response) {
        const { github_username, techs, latitude, longitude } = request.body;
        
        let dev = await Dev.findOne({ github_username });

        if(!dev){
            const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
    
            const { name = login, avatar_url, bio = 'Não Informado'} = apiResponse.data;
        
            const techsArray = parseStringAsArray(techs);
        
            const location = {
                type: 'Point',
                coordinates: [longitude, latitude],
            }
        
            dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location,
            });

            // Filtrar as conexõesque estão há no maximo 10km de distância e que o novo dev tenha pelo uma das tecnologias filtradas

            const sendSocketMessageTo = findConnection(
                { latitude, longitude},
                techsArray
            );
            
            senMessage(sendSocketMessageTo, 'new-dev', dev);
        }
        
    
        return response.json(dev);
    },

    async delete(request,response){
        const { github_username } = request.query;
        const dev = await Dev.findOne({ github_username });
        if (dev){
            await Dev.deleteOne(dev);
            return response.json( {status: "Sucesso"});
        }

        return response.json( {status: "Falha"});
    },

    async put(request, response) {
        const { github_username, techs, latitude, longitude} = request.body;
        let dev = await Dev.findOne({ github_username });

        if (!dev){
            return response.json({status: "Falha"});
        }
        
        const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
    
        const { name = login, avatar_url, bio = 'Não Informado'} = apiResponse.data;
    
        const techsArray = parseStringAsArray(techs);
        
        const location = {
            type: 'Point',
            coordinates: [longitude, latitude],
        }

        const update = {
            $set:{
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location,
            },
        };

        await Dev.updateOne(dev, update);
        dev = await Dev.findOne({ github_username });

        return response.json(dev);
    },
};