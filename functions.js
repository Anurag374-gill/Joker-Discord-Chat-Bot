/*****************************************
 * Joker Discord Bot
 * Made by CZghost/Polda18, 2019
 * ALPHA v0.0.1
 * 
 * File: functions.js
 *****************************************/

const { Permissions } = require("discord.js");
const locales = require("./locales.js");
const literals = require("./literals.js");

module.exports = {
    createError: errorMessage => {
        return `\u274c ${errorMessage}`;        // \u274c = red cross mark unicode emoji
    },

    createSuccess: successMessage => {
        return `\u2705 ${successMessage}`;      // \u2705 = green check mark unicode emoji
    },

    createInfo: infoMessage => {
        return `\u2139 ${infoMessage}`;         // \u2139 = blue info mark unicode emoji
    },

    // Get a member from a string (or message) => to be used by a message event
    getMember: (message, toFind = '') => {
        toFind = toFind.toLowerCase();          // Convert the user to find to all lowercase

        let target = message.guild.members.get(toFind);     // Try to get the member by its ID

        if (!target && message.mentions.members)            // ID not found?
            target = message.mentions.members.first();      // Get the first member mention it can find
        
        if(!target && toFind) {                             // Mention not found?
            target = message.guild.members.find(
                m => m.displayName.toLowerCase().includes(toFind) || m.user.tag.toLowerCase().includes(toFind)
            );          // Get the user tag or nick by its fragment
        }

        if(!target && toFind) { target = null;      // Still not found? That's an error, right?
        } else {
            target = message.member;                // No query defined? Get the member from message author
        }

        return target;
    },

    // Get a channel from a string => to be used by a message event
    getChannel: (message, toFind) => {
        toFind = toFind.toLowerCase();      // Convert the channel to find to all lowercase

        let target = message.guild.channels.get(toFind);    // Try to get channel by its ID
        
        if (!target && message.mentions.channels)           // ID not found?
            target = message.mentions.channels.first();     // Get the first channel mention it can find
        
        if(!target)                         // Mention not found? Then get the channel from the fragment of the name
            target = message.guild.channels.find(c => c.name.toLowerCase().includes(toFind));
        
        if(!target) target = null;          // Still not found? That's an error right?
    },

    // Format the date (use date format from settings)
    formatDate: (date, format = 'en-US') => {
        return new Intl.DateTimeFormat(format).format(date);
    },

    // Change Discord presence
    changePresence: (client, status, type, value) => {
        client.user.setStatus(status);
        client.user.setActivity(value, {type: type});
    },

    // Update presence list
    updatePresenceList: (client, package) => {
        let server_num = client.guilds.map(g => g).length;

        client.presenceList = {
            list: [
                `${client.settings.guilds.default.prefix}help`,
                'Ping me to get this server prefix',
                `Hosted on ${server_num} server${server_num !== 1 ? 's' : ''}`,
                'More informations about me, please visit GitHub',
                package.homepage
            ],
            position: 0
        }
    },

    // Set up presence timer
    setupPresenceTimer: (client) => {
        // If there is an interval set, clear the interval (has to be in try/catch block, in case interval ID is ivalid)
        if(client.tickPresence) try { clearInterval(client.tickPresence) } catch(e) { console.error(e) };
        
        // Define a new interval
        client.tickPresence = setInterval(() => {
            let index = client.presenceList.position;
            let current_presence = client.presenceList.list[index];
    
            this.changePresence(client, 'online', 'PLAYING', current_presence);
            client.presenceList.position = (index + 1) % client.presenceList.list.length;
        }, 5000);
    },

    // Update presence data
    updatePresenceData: (client, event) => {
        // If there is an interval set, clear the interval (has to be in try/catch block, in case interval ID is ivalid)
        if(client.tickPresence) try { clearInterval(client.tickPresence) } catch(e) { console.error(e) };

        // Change a presence to a message about a join or leave
        switch(event) {
            case 'JOIN':
                this.changePresence(client, 'dnd', 'WATCHING', 'Joined a new server');
                break;
            case 'LEAVE':
                this.changePresence(client, 'dnd', 'WATCHING', 'Left a server');
                break;
            default:
                console.error('Invalid argument passed'.warn);
        }

        // Set a new interval after 5 seconds
        setTimeout(() => this.setupPresenceTimer(client), 5000);
    },

    // Resolve locale string
    resolveLocale: (localeString, localeCode) => {
        localeString = localeString.toLowerCase().trim();

        // Anything else than #locale{<content>} isn't a locale string
        if(!localeString.startsWith('#locale{') || !localeString.endsWith('}')) return localeString;

        if(!literals.locales.includes(localeCode)) return null;     // Could not recognise locale code

        // Check a locale string for any matches
        const regex = /#locale\{([a-zA-Z0-9_:]+)\}/g;

        // Get the content of the brackets and split by colon
        let content = regex.exec(localeString)[1].split(':');

        // Get the available locales for this locale string
        let availableLocales = content.reduce((o, i) => {
            try {
                return o[i];        // Decompile string to an object reference
            } catch(e) {
                return undefined;   // If reached an unreachable end, return undefined (safe reference)
            }
        }, locales.locale_strings);

        if(!availableLocales || availableLocales.constructor !== Object) return null;       // Reached an unreachable reference

        // Locale string for this locale code not found => use default locale code
        if(!Object.prototype.hasOwnProperty.call(availableLocales, localeString)) return availableLocales[locales.default_locale];

        // Get and return the correct locale string
        return availableLocales[localeCode];
    },

    validatePermission: (permission) => {
        if(typeof permission !== 'string' && !Array.isArray(permission)) return false;

        let validate = true;

        if(Array.isArray(permission)) {
            permission.forEach(p => {
                validate = validate && Object.prototype.hasOwnProperty.call(Permissions.FLAGS, permission);
            });

            return validate;
        } else {
            return Object.prototype.hasOwnProperty.call(Permissions.FLAGS, permission);
        }
    }
}