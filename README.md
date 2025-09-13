# GitHub Unfollow Tracker

A Node.js tool to track who doesn't follow you back on GitHub and analyze your follower relationships.

## Features

- 🔐 **Authenticated API requests** - No more rate limit issues
- 📊 **Comprehensive analysis** - Find who doesn't follow you back and vice versa
- 🔄 **Auto-unfollow feature** - Automatically unfollow users who don't follow you back
- 🤝 **Auto-follow feature** - Automatically follow back users who follow you (respects ignore list)
- 🚫 **Unfollower tracking** - Permanently ignore users who unfollow you
- 🛡️ **Smart filtering** - Never suggest following back someone who previously unfollowed you
- 🧪 **Dry run mode** - Preview what would happen before making changes
- 💾 **Automatic data backup** - Saves current data to JSON files
- 🚀 **Fast and efficient** - Uses GitHub API pagination and optimized algorithms
- 📱 **User-friendly output** - Clear, emoji-rich console output
- ⚡ **Rate limiting** - Respects GitHub API limits with automatic delays

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "GitHub Unfollow Tracker"
4. Select the following scopes:
   - `read:user` (to read your profile)
   - `user:follow` (to read follower/following data)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### 2. Set Environment Variable

#### On Linux/Mac:
```bash
export GITHUB_TOKEN=your_token_here
```

#### On Windows (Command Prompt):
```cmd
set GITHUB_TOKEN=your_token_here
```

#### On Windows (PowerShell):
```powershell
$env:GITHUB_TOKEN="your_token_here"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Tool

```bash
node index.js
```

## Output

The tool will generate several files:

### Analysis Files
- `current_followers.json` - Your current followers
- `current_following.json` - People you're following  
- `not_following_back.json` - People you follow who don't follow you back
- `you_dont_follow_back.json` - People who follow you but you don't follow back (filtered by ignore list)

### Unfollow Feature Files
- `unfollowed_users.json` - Users you successfully unfollowed (if using unfollow feature)
- `failed_unfollows.json` - Users that couldn't be unfollowed (if any failures occur)

### Follow Feature Files
- `followed_users.json` - Users you successfully followed back (if using follow feature)
- `failed_follows.json` - Users that couldn't be followed (if any failures occur)

### Unfollower Tracking Files
- `unfollower_ignore_list.json` - Permanent list of users who unfollowed you (never suggest these again)
- `unfollower_history.json` - Historical record of all unfollowers with timestamps

## Example Output

```
🔍 Checking unfollowers for @biagiola...

🚫 Loaded ignore list: 5 users to ignore

📡 Fetching data from https://api.github.com/users/biagiola/followers...
   📄 Page 1: 100 items (Total: 100)
   📄 Page 2: 23 items (Total: 123)

📡 Fetching data from https://api.github.com/users/biagiola/following...
   📄 Page 1: 100 items (Total: 100)
   📄 Page 2: 50 items (Total: 150)

😠 UNFOLLOWER ALERT!
3 people unfollowed you since last run:
1. @baduser1 - https://github.com/baduser1
2. @baduser2 - https://github.com/baduser2
3. @baduser3 - https://github.com/baduser3

🚫 Added 3 unfollowers to permanent ignore list

💾 Saved 123 items to current_followers.json
💾 Saved 150 items to current_following.json
💾 Saved 3 items to unfollower_history.json

🚫 Filtered out 8 users from "you don't follow back" list (they're on ignore list)

📊 SUMMARY:
👥 You follow: 150 people
👥 Your followers: 123 people
💔 Don't follow you back: 89 people
🤝 You don't follow back: 54 people
🚫 Total users ignored: 8 people
   (8 potential follows filtered out due to ignore list)

💔 PEOPLE WHO DON'T FOLLOW YOU BACK:
1. @user1 - https://github.com/user1
2. @user2 - https://github.com/user2
...

🤝 PEOPLE YOU DON'T FOLLOW BACK (Filtered - Safe to Follow):
1. @gooduser1 - https://github.com/gooduser1
2. @gooduser2 - https://github.com/gooduser2
...

💡 These users are NOT on your ignore list - they never unfollowed you before

🤔 UNFOLLOW OPTIONS:
You have 89 people who don't follow you back.
Would you like to unfollow them automatically?

Do you want to unfollow them? (yes/no): yes
Do you want to do a dry run first? (recommended - yes/no): yes

🧪 DRY RUN - Showing what would happen without actually unfollowing:

🔄 DRY RUN: Simulating unfollow 89 users...
[1/89] Would unfollow @user1...
📝 Would unfollow @user1
[2/89] Would unfollow @user2...
📝 Would unfollow @user2
...

Do you want to proceed with actual unfollowing? (yes/no): yes

⚠️  FINAL CONFIRMATION:
You are about to unfollow 89 users.
This action cannot be undone automatically.
Type "UNFOLLOW" to confirm (or anything else to cancel): UNFOLLOW

🚀 Starting unfollow process...

🔄 Starting to unfollow 89 users...
[1/89] Unfollowing @user1...
   ✅ Successfully unfollowed @user1
[2/89] Unfollowing @user2...
   ✅ Successfully unfollowed @user2
...

📊 UNFOLLOW RESULTS:
✅ Successfully unfollowed: 87 users
❌ Failed to unfollow: 2 users

✅ Unfollow process complete!

🤝 FOLLOW OPTIONS:
You have 54 people who follow you but you don't follow back.
These users are NOT on your ignore list (they never unfollowed you).
Would you like to follow them back automatically?

Do you want to follow them back? (yes/no): yes
Do you want to do a dry run first? (recommended - yes/no): yes

🧪 DRY RUN - Showing what would happen without actually following:

🔄 DRY RUN: Simulating follow 54 users...
[1/54] Would follow @gooduser1...
📝 Would follow @gooduser1
[2/54] Would follow @gooduser2...
📝 Would follow @gooduser2
...

Do you want to proceed with actual following? (yes/no): yes

⚠️  FINAL CONFIRMATION:
You are about to follow 54 users.
These users are safe to follow (not on ignore list).
Type "FOLLOW" to confirm (or anything else to cancel): FOLLOW

🚀 Starting follow process...

🔄 Starting to follow 54 users...
[1/54] Following @gooduser1...
   ✅ Successfully followed @gooduser1
[2/54] Following @gooduser2...
   ✅ Successfully followed @gooduser2
...

📊 FOLLOW RESULTS:
✅ Successfully followed: 52 users
❌ Failed to follow: 2 users

✅ Follow process complete!
✅ Analysis complete! Check the generated JSON files for detailed results.
```

## Unfollow Feature

The tool can automatically unfollow users who don't follow you back. This feature includes several safety measures:

### Safety Features
- 🧪 **Dry run mode** - Preview exactly what would happen without making changes
- 🔒 **Multiple confirmations** - You must confirm multiple times before unfollowing
- ⚡ **Rate limiting** - 1-second delay between unfollow requests
- 📊 **Detailed logging** - See exactly what's happening in real-time
- 💾 **Result tracking** - Saves successful and failed unfollows to JSON files

### How It Works
1. After analysis, you'll be asked if you want to unfollow users
2. **Dry run** (recommended) - Shows what would happen without actually unfollowing
3. **Final confirmation** - You must type "UNFOLLOW" to proceed
4. **Batch processing** - Unfollows users one by one with progress tracking
5. **Results summary** - Shows success/failure counts and saves detailed logs

### Required Token Permissions
Your GitHub token needs the `user:follow` scope to unfollow and follow users. This is included in the setup instructions above.

## Follow Feature

The tool can automatically follow back users who follow you, but **only if they're not on your ignore list**. This ensures you never follow someone who previously unfollowed you.

### Safety Features
- 🛡️ **Ignore list protection** - Never follows users who previously unfollowed you
- 🧪 **Dry run mode** - Preview exactly what would happen before making changes
- 🔒 **Multiple confirmations** - You must confirm multiple times before following
- ⚡ **Rate limiting** - 1-second delay between follow requests
- 📊 **Detailed logging** - See exactly what's happening in real-time
- 💾 **Result tracking** - Saves successful and failed follows to JSON files

### How It Works
1. After analysis, you'll be asked if you want to follow back users
2. **Smart filtering** - Only shows users who are NOT on your ignore list
3. **Dry run** (recommended) - Shows what would happen without actually following
4. **Final confirmation** - You must type "FOLLOW" to proceed
5. **Batch processing** - Follows users one by one with progress tracking
6. **Results summary** - Shows success/failure counts and saves detailed logs

### Key Benefits
- 🤝 **Reciprocal following** - Automatically follow back genuine followers
- 🚫 **Ignore list respect** - Never follows users who previously unfollowed you
- ⚡ **Efficient** - Batch process multiple follows with rate limiting
- 🔍 **Safe** - Multiple confirmation steps prevent accidental follows

## Unfollower Tracking System

This feature solves the common problem of "follow-unfollow" users who follow you, wait for you to follow back, then immediately unfollow you.

### How It Works
1. **First Run**: Creates baseline of your current followers
2. **Subsequent Runs**: Compares current followers with previous data
3. **Unfollower Detection**: Automatically detects who unfollowed you
4. **Permanent Ignore**: Adds unfollowers to a permanent ignore list
5. **Smart Filtering**: Never suggests following back someone who previously unfollowed you

### Key Benefits
- 🚫 **Permanent Memory** - Once someone unfollows you, they're permanently ignored
- 🛡️ **Protection** - Prevents you from falling for the same follow-unfollow trick twice
- 📊 **History Tracking** - Keeps a complete history of all unfollowers with timestamps
- 🔄 **Automatic** - No manual work required, everything happens automatically

### Files Generated
- `unfollower_ignore_list.json` - The permanent ignore list (this is your protection)
- `unfollower_history.json` - Complete historical record of all unfollowers

### What Happens When Someone Unfollows You
1. Next time you run the program, it detects they unfollowed you
2. Shows you an "UNFOLLOWER ALERT" with their username
3. Automatically adds them to the permanent ignore list
4. They will never appear in your "safe to follow" recommendations again
5. If they follow you again in the future, they'll be filtered out automatically

## Rate Limits

With authentication, you get:
- **5,000 requests per hour** (vs 60 unauthenticated)
- **No more rate limit errors** for normal usage
- **Automatic rate limiting** for unfollow operations (1 request per second)

## Troubleshooting

### "Please set GITHUB_TOKEN environment variable"
- Make sure you've set the environment variable correctly
- The token should start with `ghp_` (classic token)

### "Authentication failed"
- Check that your token is valid and not expired
- Ensure you've copied the complete token
- Make sure the token has the required scopes

### "API rate limit exceeded"
- Wait for the rate limit to reset (usually 1 hour)
- Check if your token is working correctly

## Security

- **Never commit your token to version control**
- Keep your token secure and don't share it
- Regenerate your token if it's compromised
- Consider using GitHub CLI for additional security

## Legacy Files

The old JSON files (`followers1-100.json`, `following1-100.json`, etc.) are no longer needed and can be deleted. The new version fetches fresh data automatically. 