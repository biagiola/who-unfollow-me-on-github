const fs = require('fs');
const https = require('https');

// Try to load .env file if it exists
try {
    require('dotenv').config();
} catch (error) {
    // dotenv not installed, continue without it
}

// Configuration
const USERNAME = require('./username.json').replace(/"/g, ''); // Remove quotes if any
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set this as environment variable

if (!GITHUB_TOKEN) {
    console.error('❌ Please set GITHUB_TOKEN environment variable');
    console.log('💡 Create a personal access token at: https://github.com/settings/tokens');
    console.log('💡 Option 1: Set environment variable: export GITHUB_TOKEN=your_token_here');
    console.log('💡 Option 2: Create .env file with: GITHUB_TOKEN=your_token_here');
    process.exit(1);
}

/**
 * Make authenticated request to GitHub API
 */
async function makeGitHubRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'User-Agent': 'GitHub-Unfollow-Tracker',
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        // Some DELETE requests return empty responses
                        const result = data ? JSON.parse(data) : { success: true };
                        resolve(result);
                    } catch (error) {
                        // If JSON parsing fails but status is OK, assume success
                        resolve({ success: true });
                    }
                } else {
                    reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

/**
 * Fetch all pages of data from GitHub API
 */
async function fetchAllPages(baseUrl) {
    let allData = [];
    let page = 1;
    let hasMore = true;

    console.log(`📡 Fetching data from ${baseUrl}...`);

    while (hasMore) {
        try {
            const url = `${baseUrl}?page=${page}&per_page=100`;
            const data = await makeGitHubRequest(url);
            
            if (data.length === 0) {
                hasMore = false;
            } else {
                allData = allData.concat(data);
                console.log(`   📄 Page ${page}: ${data.length} items (Total: ${allData.length})`);
                page++;
            }
        } catch (error) {
            console.error(`❌ Error fetching page ${page}:`, error.message);
            throw error;
        }
    }

    return allData;
}

/**
 * Save data to JSON file for backup/debugging
 */
function saveToFile(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`💾 Saved ${data.length} items to ${filename}`);
    } catch (error) {
        console.error(`❌ Failed to save ${filename}:`, error.message);
    }
}

/**
 * Load data from JSON file, return empty array if file doesn't exist
 */
function loadFromFile(filename, defaultValue = []) {
    try {
        if (fs.existsSync(filename)) {
            const data = fs.readFileSync(filename, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`❌ Failed to load ${filename}:`, error.message);
        return defaultValue;
    }
}

/**
 * Save unfollower ignore list with metadata
 */
function saveIgnoreList(ignoreList) {
    try {
        const data = {
            lastUpdated: new Date().toISOString(),
            totalIgnored: ignoreList.length,
            users: ignoreList
        };
        fs.writeFileSync('unfollower_ignore_list.json', JSON.stringify(data, null, 2));
        console.log(`🚫 Updated ignore list: ${ignoreList.length} users to ignore`);
    } catch (error) {
        console.error(`❌ Failed to save ignore list:`, error.message);
    }
}

/**
 * Load unfollower ignore list
 */
function loadIgnoreList() {
    try {
        const data = loadFromFile('unfollower_ignore_list.json', { users: [] });
        return data.users || [];
    } catch (error) {
        console.error(`❌ Failed to load ignore list:`, error.message);
        return [];
    }
}

/**
 * Detect users who unfollowed since last run
 */
function detectUnfollowers(currentFollowers, previousFollowers) {
    if (!previousFollowers || previousFollowers.length === 0) {
        console.log('📝 No previous follower data found - this is the first run or previous data was cleared');
        return [];
    }

    const currentFollowerIds = new Set(currentFollowers.map(user => user.id));
    const unfollowers = previousFollowers.filter(user => !currentFollowerIds.has(user.id));
    
    return unfollowers;
}

/**
 * Add users to ignore list
 */
function addToIgnoreList(users, ignoreList) {
    const ignoreIds = new Set(ignoreList.map(user => user.id));
    const newIgnores = users.filter(user => !ignoreIds.has(user.id));
    
    if (newIgnores.length > 0) {
        newIgnores.forEach(user => {
            ignoreList.push({
                id: user.id,
                login: user.login,
                html_url: user.html_url,
                unfollowed_date: new Date().toISOString(),
                reason: 'unfollowed_you'
            });
        });
        return newIgnores;
    }
    return [];
}

/**
 * Filter out ignored users from a list
 */
function filterIgnoredUsers(users, ignoreList) {
    const ignoreIds = new Set(ignoreList.map(user => user.id));
    return users.filter(user => !ignoreIds.has(user.id));
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get user input from command line
 */
function getUserInput(question) {
    return new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

/**
 * Unfollow a single user
 */
async function unfollowUser(username) {
    try {
        const url = `https://api.github.com/user/following/${username}`;
        await makeGitHubRequest(url, 'DELETE');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Follow a single user
 */
async function followUser(username) {
    try {
        const url = `https://api.github.com/user/following/${username}`;
        await makeGitHubRequest(url, 'PUT');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Unfollow multiple users with rate limiting and progress tracking
 */
async function unfollowUsers(users, dryRun = false) {
    console.log(`\n🔄 ${dryRun ? 'DRY RUN: Simulating' : 'Starting to'} unfollow ${users.length} users...\n`);
    
    const results = {
        success: [],
        failed: [],
        total: users.length
    };
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const progress = `[${i + 1}/${users.length}]`;
        
        console.log(`${progress} ${dryRun ? 'Would unfollow' : 'Unfollowing'} @${user.login}...`);
        
        if (!dryRun) {
            const result = await unfollowUser(user.login);
            
            if (result.success) {
                console.log(`   ✅ Successfully unfollowed @${user.login}`);
                results.success.push(user);
            } else {
                console.log(`   ❌ Failed to unfollow @${user.login}: ${result.error}`);
                results.failed.push({ user, error: result.error });
            }
            
            // Rate limiting: wait 1 second between requests to avoid hitting limits
            if (i < users.length - 1) {
                await sleep(1000);
            }
        } else {
            console.log(`   📝 Would unfollow @${user.login}`);
            results.success.push(user);
        }
    }
    
    return results;
}

/**
 * Follow multiple users with rate limiting and progress tracking
 */
async function followUsers(users, dryRun = false) {
    console.log(`\n🔄 ${dryRun ? 'DRY RUN: Simulating' : 'Starting to'} follow ${users.length} users...\n`);
    
    const results = {
        success: [],
        failed: [],
        total: users.length
    };
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const progress = `[${i + 1}/${users.length}]`;
        
        console.log(`${progress} ${dryRun ? 'Would follow' : 'Following'} @${user.login}...`);
        
        if (!dryRun) {
            const result = await followUser(user.login);
            
            if (result.success) {
                console.log(`   ✅ Successfully followed @${user.login}`);
                results.success.push(user);
            } else {
                console.log(`   ❌ Failed to follow @${user.login}: ${result.error}`);
                results.failed.push({ user, error: result.error });
            }
            
            // Rate limiting: wait 1 second between requests to avoid hitting limits
            if (i < users.length - 1) {
                await sleep(1000);
            }
        } else {
            console.log(`   📝 Would follow @${user.login}`);
            results.success.push(user);
        }
    }
    
    return results;
}

/**
 * Main function to check who doesn't follow back
 */
async function checkUnfollowers() {
    try {
        console.log(`🔍 Checking unfollowers for @${USERNAME}...\n`);

        // Load previous data and ignore list
        const previousFollowers = loadFromFile('current_followers.json', []);
        const ignoreList = loadIgnoreList();

        console.log(`🚫 Loaded ignore list: ${ignoreList.length} users to ignore`);

        // Fetch current followers and following
        const [followers, following] = await Promise.all([
            fetchAllPages(`https://api.github.com/users/${USERNAME}/followers`),
            fetchAllPages(`https://api.github.com/users/${USERNAME}/following`)
        ]);

        // Detect unfollowers since last run
        const unfollowers = detectUnfollowers(followers, previousFollowers);
        
        if (unfollowers.length > 0) {
            console.log(`\n😠 UNFOLLOWER ALERT!`);
            console.log(`${unfollowers.length} people unfollowed you since last run:`);
            unfollowers.forEach((user, index) => {
                console.log(`${index + 1}. @${user.login} - ${user.html_url}`);
            });
            
            // Add unfollowers to ignore list
            const newIgnores = addToIgnoreList(unfollowers, ignoreList);
            if (newIgnores.length > 0) {
                console.log(`\n🚫 Added ${newIgnores.length} unfollowers to permanent ignore list`);
                saveIgnoreList(ignoreList);
            }
            
            // Save unfollower history
            const unfollowerHistory = loadFromFile('unfollower_history.json', []);
            unfollowers.forEach(user => {
                unfollowerHistory.push({
                    ...user,
                    unfollowed_date: new Date().toISOString()
                });
            });
            saveToFile('unfollower_history.json', unfollowerHistory);
        } else if (previousFollowers.length > 0) {
            console.log(`✅ No unfollowers detected since last run`);
        }

        // Save current data for backup and next comparison
        saveToFile('current_followers.json', followers);
        saveToFile('current_following.json', following);

        // Create sets for efficient lookup
        const followerIds = new Set(followers.map(user => user.id));
        const followingIds = new Set(following.map(user => user.id));

        // Find people you follow but who don't follow you back
        const notFollowingBack = following.filter(user => !followerIds.has(user.id));
        
        // Find people who follow you but you don't follow back (filtered by ignore list)
        const youDontFollowBackRaw = followers.filter(user => !followingIds.has(user.id));
        const youDontFollowBack = filterIgnoredUsers(youDontFollowBackRaw, ignoreList);
        
        // Show how many were filtered out
        const filteredCount = youDontFollowBackRaw.length - youDontFollowBack.length;
        if (filteredCount > 0) {
            console.log(`\n🚫 Filtered out ${filteredCount} users from "you don't follow back" list (they're on ignore list)`);
        }

        // Display results
        console.log('\n📊 SUMMARY:');
        console.log(`👥 You follow: ${following.length} people`);
        console.log(`👥 Your followers: ${followers.length} people`);
        console.log(`💔 Don't follow you back: ${notFollowingBack.length} people`);
        console.log(`🤝 You don't follow back: ${youDontFollowBack.length} people`);
        console.log(`🚫 Total users ignored: ${ignoreList.length} people`);
        if (filteredCount > 0) {
            console.log(`   (${filteredCount} potential follows filtered out due to ignore list)`);
        }

        if (notFollowingBack.length > 0) {
            console.log('\n💔 PEOPLE WHO DON\'T FOLLOW YOU BACK:');
            notFollowingBack.forEach((user, index) => {
                console.log(`${index + 1}. @${user.login} - ${user.html_url}`);
            });
        }

        if (youDontFollowBack.length > 0) {
            console.log('\n🤝 PEOPLE YOU DON\'T FOLLOW BACK (Filtered - Safe to Follow):');
            youDontFollowBack.slice(0, 10).forEach((user, index) => {
                console.log(`${index + 1}. @${user.login} - ${user.html_url}`);
            });
            if (youDontFollowBack.length > 10) {
                console.log(`   ... and ${youDontFollowBack.length - 10} more`);
            }
            console.log(`\n💡 These users are NOT on your ignore list - they never unfollowed you before`);
        }

        // Save results
        saveToFile('not_following_back.json', notFollowingBack);
        saveToFile('you_dont_follow_back.json', youDontFollowBack);

        // Ask if user wants to unfollow people who don't follow back
        if (notFollowingBack.length > 0) {
            console.log('\n🤔 UNFOLLOW OPTIONS:');
            console.log(`You have ${notFollowingBack.length} people who don't follow you back.`);
            console.log('Would you like to unfollow them automatically?');
            
            const wantToUnfollow = await getUserInput('\nDo you want to unfollow them? (yes/no): ');
            
            if (wantToUnfollow === 'yes' || wantToUnfollow === 'y') {
                // First, offer a dry run
                const dryRunAnswer = await getUserInput('Do you want to do a dry run first? (recommended - yes/no): ');
                
                if (dryRunAnswer === 'yes' || dryRunAnswer === 'y') {
                    console.log('\n🧪 DRY RUN - Showing what would happen without actually unfollowing:');
                    await unfollowUsers(notFollowingBack, true);
                    
                    const proceedAnswer = await getUserInput('\nDo you want to proceed with actual unfollowing? (yes/no): ');
                    if (proceedAnswer !== 'yes' && proceedAnswer !== 'y') {
                        console.log('👍 Unfollowing cancelled. Analysis results saved to JSON files.');
                        return;
                    }
                }
                
                // Final confirmation
                console.log(`\n⚠️  FINAL CONFIRMATION:`);
                console.log(`You are about to unfollow ${notFollowingBack.length} users.`);
                console.log(`This action cannot be undone automatically.`);
                
                const finalConfirm = await getUserInput('Type "UNFOLLOW" to confirm (or anything else to cancel): ');
                
                if (finalConfirm === 'unfollow') {
                    console.log('\n🚀 Starting unfollow process...');
                    const results = await unfollowUsers(notFollowingBack, false);
                    
                    // Display final results
                    console.log('\n📊 UNFOLLOW RESULTS:');
                    console.log(`✅ Successfully unfollowed: ${results.success.length} users`);
                    console.log(`❌ Failed to unfollow: ${results.failed.length} users`);
                    
                    if (results.failed.length > 0) {
                        console.log('\n❌ FAILED UNFOLLOWS:');
                        results.failed.forEach((item, index) => {
                            console.log(`${index + 1}. @${item.user.login} - ${item.error}`);
                        });
                    }
                    
                    // Save unfollow results
                    saveToFile('unfollowed_users.json', results.success);
                    if (results.failed.length > 0) {
                        saveToFile('failed_unfollows.json', results.failed);
                    }
                    
                    console.log('\n✅ Unfollow process complete!');
                } else {
                    console.log('👍 Unfollowing cancelled.');
                }
            } else {
                console.log('👍 No unfollowing will be performed.');
            }
        }

        // Ask if user wants to follow people who follow them (filtered by ignore list)
        if (youDontFollowBack.length > 0) {
            console.log('\n🤝 FOLLOW OPTIONS:');
            console.log(`You have ${youDontFollowBack.length} people who follow you but you don't follow back.`);
            console.log('These users are NOT on your ignore list (they never unfollowed you).');
            console.log('Would you like to follow them back automatically?');
            
            const wantToFollow = await getUserInput('\nDo you want to follow them back? (yes/no): ');
            
            if (wantToFollow === 'yes' || wantToFollow === 'y') {
                // First, offer a dry run
                const dryRunAnswer = await getUserInput('Do you want to do a dry run first? (recommended - yes/no): ');
                
                if (dryRunAnswer === 'yes' || dryRunAnswer === 'y') {
                    console.log('\n🧪 DRY RUN - Showing what would happen without actually following:');
                    await followUsers(youDontFollowBack, true);
                    
                    const proceedAnswer = await getUserInput('\nDo you want to proceed with actual following? (yes/no): ');
                    if (proceedAnswer !== 'yes' && proceedAnswer !== 'y') {
                        console.log('👍 Following cancelled. Analysis results saved to JSON files.');
                        return;
                    }
                }
                
                // Final confirmation
                console.log(`\n⚠️  FINAL CONFIRMATION:`);
                console.log(`You are about to follow ${youDontFollowBack.length} users.`);
                console.log(`These users are safe to follow (not on ignore list).`);
                
                const finalConfirm = await getUserInput('Type "FOLLOW" to confirm (or anything else to cancel): ');
                
                if (finalConfirm === 'follow') {
                    console.log('\n🚀 Starting follow process...');
                    const results = await followUsers(youDontFollowBack, false);
                    
                    // Display final results
                    console.log('\n📊 FOLLOW RESULTS:');
                    console.log(`✅ Successfully followed: ${results.success.length} users`);
                    console.log(`❌ Failed to follow: ${results.failed.length} users`);
                    
                    if (results.failed.length > 0) {
                        console.log('\n❌ FAILED FOLLOWS:');
                        results.failed.forEach((item, index) => {
                            console.log(`${index + 1}. @${item.user.login} - ${item.error}`);
                        });
                    }
                    
                    // Save follow results
                    saveToFile('followed_users.json', results.success);
                    if (results.failed.length > 0) {
                        saveToFile('failed_follows.json', results.failed);
                    }
                    
                    console.log('\n✅ Follow process complete!');
                } else {
                    console.log('👍 Following cancelled.');
                }
            } else {
                console.log('👍 No following will be performed.');
            }
        }

        console.log('\n✅ Analysis complete! Check the generated JSON files for detailed results.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('API rate limit')) {
            console.log('\n💡 Rate limit exceeded. Try again later or check your token permissions.');
        } else if (error.message.includes('401')) {
            console.log('\n💡 Authentication failed. Please check your GITHUB_TOKEN.');
        }
    }
}

// Run the script
checkUnfollowers();

