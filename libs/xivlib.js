const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const { PromisePool } = require('@supercharge/promise-pool');
const nodestone = require('@xivapi/nodestone');

const parsers = {
    achievements: new nodestone.Achievements(),
    character: new nodestone.Character(),
    characterSearch: new nodestone.CharacterSearch()
};

const ACHIEVEMENT_COMPLETE = 'entry__achievement__view--complete';
const LODESTONE_URL = 'https://na.finalfantasyxiv.com/lodestone/character/';

const generateChallenge = (character, server) => {
    const charString = (character + server).toLowerCase();
    const hash = crypto.createHash('sha1');
    hash.update(charString);
    digest = hash.digest('base64')
    return digest;
};

const getCharacterId = async (character, server) => {
    const res = await parsers.characterSearch.parse({ query: { name: character, server: server }});
    const charInfo = res.List[0];
    if (charInfo) {
        return charInfo.ID.toString();
    } else {
        return -1;
    }
};

const getAchievementsComplete = async (characterId, achievementIds) => {
    console.log(characterId, achievementIds);
    const achievementSet = new Set();
    const { errors } = await PromisePool
        .for(achievementIds)
        .withConcurrency(10)
        .process(async (achievementId) => {
            if (await getAchievementComplete(characterId, achievementId)) {
                achievementSet.add(achievementId);
            };
        });
    errors.forEach(error => console.log(error));
    return achievementSet;
};

const getAchievementComplete = async (characterId, achievementId) => {
    const url = getUrl([characterId, 'achievement', 'detail', achievementId]);
    return axios.get(url)
                .then(response => response.data.includes(ACHIEVEMENT_COMPLETE))
                .catch(error => error);
};

const verifyCharacter = async (characterId) => {
    const res = await parsers.character.parse({ params: { characterId: characterId } });
    const character = res.Name;
    const server = res.World;
    const challenge = generateChallenge(character, server);
    return res.Bio.includes(challenge);
};

const getUrl = (parts) => {
    const urlPath = path.join.apply(null, parts);
    return new URL(urlPath, LODESTONE_URL).href;
};

module.exports = { generateChallenge, getAchievementsComplete, getCharacterId, getUrl, verifyCharacter, parsers }