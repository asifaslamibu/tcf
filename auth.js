const { ActiveDirectory } = require('node-ad-tools');

const myADConfig = {
    url: 'ldap://pdcserver.thecitizensfoundation.org', // You can use DNS as well, like domain.local
    base: 'dc=thecitizensfoundation, dc=org'
}

const myAD = new ActiveDirectory(myADConfig);

myAD.loginUser('TCF\\p2pt.user','Gh$12%K3#2+')
    .then(res => {
        // If it failed to auth user find out why
        if(!res.success) {
            console.log(res.message);
            return;
        }

        const user = ActiveDirectory.createUserObj(res.entry);
        console.log(user);
    })
    .catch(err => console.error(err))
