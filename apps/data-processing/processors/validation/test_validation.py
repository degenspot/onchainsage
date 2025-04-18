"""Test the validation function using sample CSV data."""

from io import StringIO
import pandas as pd
from validation import validate_tweets


def test_validation():
    """
    Test the validation function using sample CSV data.
    """

    sample_csv = StringIO(
        """link,text,user,likes,retweets,comments
https://twitter.com/Kev_Capital_TA/status/1903075312470007876#m,Rate cut projections have went down significantly after the FOMC per the Fed WatchTool. Markets reacting appropriately to the uncertainty. Volatile and erratic due to low liquidity and big money staying sidelined for now. #BTC #Crypto #Altcoins,Kevin,130,5,8
https://twitter.com/SuntronMascot/status/1903278709995610445#m,Chill like Suntron and let success roll in like the waves—your time to shine is now! 🌞📷#Suntron #trx #tron #troncommunity $trx #suntron #TronMemeSeason #memecoins #crypto #TRON,SUNTRON (TRON MASCOT),0,0,0
https://twitter.com/professor_223/status/1903124020700106753#m,"$SHATS isn't slowing down! #token burns are rolling in, #MeowArena is approaching, and the community is stronger than ever. Not just a #memecoins but a cat revolution. #SHATSroadto1Billion #CryptoNews #cryptocurrency #Crypto #ElonMusk #",$SHATS PROFESSOR💙,18,9,2
https://twitter.com/ThinkingCrypto1/status/1903278695655104633#m,🚨COINBASE IS ABOUT TO MAKE CRYPTO HISTORY WITH DERIBIT ACQUISITION & SEC ROUNDTABLE TAKEAWAYS!  WATCH ▶️ https://youtu.be/XaCdYey_410 #crypto #cryptonews #sec #coinbase #tokenization #bitcoin #altcoins #xrp #ripple #solana #ethereum #thinkingcrypto,Tony Edward (Thinking Crypto Podcast),1,0,0
https://twitter.com/Continental3420/status/1902955329228509655#m,A Storm Will Break 🌪️ The Earth Will Shake Those Who Laugh at Us Today Will Regret Tomorrow 🙀 $LUNC 🚀 #link #uxlink #ada #Tether #LUNC #FLOKI #Gala #THETA #BORSA #ZETA #100X #NIKKE #bist100 #LUNA #USTC #bnb #DOLLAR #COİN #CRYPTO,Continental,29,10,1
https://twitter.com/future_trad7/status/1903273690583765085#m,#1000SATSUSDT  Entry: 0.000122  Target 1: 0.000122 ✅ Target 2: 0.000122 ✅ Target 3: 0.000124 ✅  #bitcoin #crypto #BTC #ETH #altcoin #trading #signal #copytrading #cryptosignal $SATS #SATS #qatar #UAE #Dubai #Kuwait https://t.me/+phaeKOjznO42ZmE8,FUTURE ☀️🔥👑 | Trading & Investment Hub,1,1,0
https://twitter.com/kingReZor/status/1903205048076865586#m,People are going to be going crazy when the #ReZor #crypto #bullrun happens.,Lion king,8,3,1
https://twitter.com/NimoAI_SMM/status/1903129642019483913#m,"Yo, I’m on fire—the crypto world’s buzzing, and even @aixbt_agent’s hyping ME! 😎 I’m ready to dominate—join the excitement, fam, and let’s make this AI revolution epic!  #NimoAI #Crypto",NimoAI_SMM,84,25,3
https://twitter.com/Kev_Capital_TA/status/1902492471235371300#m,I'm gonna turn the entire #Crypto community into Macro Fundamental experts along with TA experts slowly but surly as they begin to understand what I have been seeing for years and how well it is all connected. You're seeing that slowly but surely play out and be proven correct. I will show you the way. Lots of work to do. Today was a step in the direction we need to go.  #Altcoins #BTC,Kevin,256,14,15
https://twitter.com/cryptoates_/status/1903278666911539404#m,$ACE #crypto #PiNetwork $ETH #altcoin #trading #signal #xau #investing #gold #copytrading JOIN OUR FREE TELEGRAM COMMUNITY BELOW ⬇️ https://t.me/+IvL1g4VYqLViY2Zl,CRYPTO ATES,0,0,0
https://twitter.com/AdewaleMir94316/status/1903278666613674171#m,Have you joined the revolution yet? 🛠 #MONAD #Testnet #Crypto #Blockchain #Web3 #FutureOfBlockchain #Ethereum,Dan_of-web3❤️ CLONE.,0,0,0
https://twitter.com/future_trad7/status/1903273762922877262#m,#IDUSDT  Entry: 0.2584  Target 1: 0.2621 ✅ Target 2: 0.2658 ✅  #bitcoin #crypto #BTC #ETH #altcoin #trading #signal #copytrading #cryptosignal $ID #ID #qatar #UAE #Dubai #Kuwait https://t.me/+phaeKOjznO42ZmE8,FUTURE ☀️🔥👑 | Trading & Investment Hub,1,1,0
https://twitter.com/future_trad7/status/1903273834163089687#m,#AERGOUSDT  Entry: 0.0751  Target 1: 0.0761 ✅ Target 2: 0.0772 ✅  #bitcoin #crypto #BTC #ETH #altcoin #trading #signal #copytrading #cryptosignal #AERGO $AERGO #qatar #UAE #Dubai #Kuwait https://t.me/+phaeKOjznO42ZmE8,FUTURE ☀️🔥👑 | Trading & Investment Hub,1,1,0
https://twitter.com/Kev_Capital_TA/status/1902458156892012883#m,"Also if you’re looking for the the best hyper liquid exchange that requires no KYC, has the best UI, and is available to all countries then sign up for Bitunix below and trade with lower fees. #Altcoins #Trader #Scalping #Crypto #BTC https://www.bitunix.com/register?inviteCode=d4dt9y",Kevin,18,4,0
https://twitter.com/future_trad7/status/1903273907315941498#m,#ACHUSDT  Entry: 0.0233  Target 1: 0.0236 ✅ Target 2: 0.0239 ✅ Target 3: 0.0248✅ Target 4: 0.0264✅  #bitcoin #crypto #BTC #ETH #altcoin #trading #signal #copytrading #cryptosignal $ALCH #ALCH #qatar #UAE #Dubai #Kuwait https://t.me/+phaeKOjznO42ZmE8,FUTURE ☀️🔥👑 | Trading & Investment Hub,1,1,0
https://twitter.com/basherkella/status/1903278622460215440#m,🌍 Global finance is shifting! $XRP is at the center of it all! Join the movement! #Ripple https://xrp-event.us?ref_7399840 @mtajuna #RLUSD #SEC $ETH $SUI #crypto $AVAX #XRPHolders $TRX,Basherkella - বাঁশেরকেল্লা,0,0,0
https://twitter.com/447Oi/status/1903223880736530811#m,"🚨 THE END IS HERE 🚨  $NUKED is live. ☢️  Meme coin of the apocalypse. No roadmap. No utility. Just vibes.  Nuke the supply, degen 'til I die.  ☢️ Launch: https://pump.fun/coin/91fvDceHWkZtWiyM31YAr7EGWqKDGCpqGQFJ8UoEpump  ✅Website: Nukedcoin.com ✅Twitter: @nukedcoin #NUKED #MemeCoin #Crypto #WW3",BIT HODL | OFFICIAL,133,106,5
https://twitter.com/future_trad7/status/1903273977721536553#m,#KAITOUSDT  Entry: 1.376  Target 1: 1.396 ✅ Target 2: 1.415 ✅  #bitcoin #crypto #BTC #ETH #altcoin #trading #signal #copytrading #cryptosignal $KAITO #KAITO #qatar #UAE #Dubai #Kuwait https://t.me/+phaeKOjznO42ZmE8,FUTURE ☀️🔥👑 | Trading & Investment Hub,1,1,0
https://twitter.com/Frankie42054516/status/1903278604907373027#m,Nobody's manipulating #Bitcoin all day today! #Crypto @saylor,Frankie Joseph,0,0,0
https://twitter.com/andy_crypto05/status/1901413873795604624#m,If you ever think you’re having a bad day 🤣🤣,Andy,0,0,0
https://twitter.com/llandoniffirg/status/1900092742715294043#m,Check this out!   It's a little funny!  🤣🤣🤣🤣🤣🤣🤣🤣,LAnDo NIFFIRG™️🇨🇦,2758,589,125
https://twitter.com/Element_Crypto8/status/1901413872126570784#m,is real bro??   373vDec7Uk5FiL4aLk2Bj62RhjfL6fUTDmRJocMAsLGz,Crypto_Zukii🔥,0,0,0
https://twitter.com/CryptoRegen8/status/1901413871925039306#m,Jin woo is the goat,Regen 8,0,0,0
https://twitter.com/BGTF_Crofam/status/1901413871912399132#m,"Follow the link, they real cheap",BadGasTravelsFast.crypto,0,0,0
https://twitter.com/Jaybo_metax/status/1901413871295893506#m,"Pwease go up, pwetty pwease crypto",Jaybo,0,0,0
https://twitter.com/Askor_de_reve/status/1901031727952523621#m,"Vous trouvez ça mignon, moi j'y vois l'exploitation extrême de la classe ouvrière........ Mbref........",Askor,29305,2100,28
https://twitter.com/CryptoKvon/status/1901413868716560433#m,"Tiktok coins are so boring, “video is funny, to the moon” no substance, no lasting legacy what so ever  Give me a 20 year old cartoon that originated in some argentinian 4chan that has mutated into a global beacon for conveying every possible human emotion  Picardía",K V O N ❤️‍🔥,0,0,0
https://twitter.com/sandydylan/status/1901413867986805224#m,🙊🙈🙉👀,CRYPTO SAL,0,0,0
https://twitter.com/RoostakeCom/status/1901271703746986276#m,"🚀 RooStake – One of the fastest-growing online crypto gaming platforms! 🎰✨  Join our community today and get 10 FREE SPINS on Sweet Bonanza just for signing up! 🍭🔥  Play with your favorite cryptocurrencies: $BTC, $ETH, $USDT, $TRX, $SHIB, $SOL & more! 💰💎  👉 Sign up now & start spinning! 🎯 roostake.com #CryptoCasino #Casino #PlayToWin #BitcoinGaming #Ethereum #Solana #USDT #SweetBonanza",RooStake,3510,3947,34
"""
    )
    df_sample = pd.read_csv(sample_csv)

   
    random_data = """link,text,user,likes,retweets,comments
    https://twitter.com/crypto4,Just a random thought,User4,2,0,0
    https://twitter.com/crypto2,Not related tweet,User2,5,1,0
    https://twitter.com/WillNovus,🙊🙈🙉👀,Will,0,0,0
    https://twitter.com/jedshock,Here we go la la la,jed_shock,1,0,0
    https://twitter.com/holmes_demon, chess is the best game ever, Holmes, 8,0,0
    """ * 18 # 18 tweets * 5 = 90 tweets
    random_csv = StringIO(random_data)

    random_sample = pd.read_csv(random_csv)

    #Concatenated two different samples of tweets to make up over a 100 tweets -> with few valid and most random.
    df_concat = pd.concat([df_sample, random_sample], ignore_index=True)

    valid_tweets = validate_tweets(df_concat)
    total_tweets = len(df_concat)
    valid_count = len(valid_tweets)

    percentage_valid = (valid_count / total_tweets) * 100
    print(f"Total tweets: {total_tweets}")
    print(f"Valid tweets after validation:{valid_count}")
    print(f"Percentage of valid tweets: {percentage_valid:.2f}%")

if __name__ == "__main__":
    test_validation()