#include <bits/stdc++.h>
#include<ext/pb_ds/assoc_container.hpp>
#include<ext/pb_ds/tree_policy.hpp>

using namespace std;
using namespace __gnu_pbds;

typedef tree<int, null_type, less<int>, rb_tree_tag, tree_order_statistics_node_update> pbds; // find_by_order, order_of_key

#define ll long long
#define f(i,n) for(int i=0;i<n;i++)
#define mi map<int,int>
#define ml map<ll,ll>
#define vi vector<int>
#define vl vector<ll>
#define vvi vector<vector<int>>
#define vvl vector<vector<ll>>
#define vpi vector<pair<int,int>>
#define vpl vector<pair<ll,ll>
#define si set<int>
#define sl set<ll>
#define MOD long(1e9+7)

void yes(){
    cout<<"YES"<<endl;
}

void no(){
    cout<<"NO"<<endl;
}

bool comp1asc(pair<int,int> a,pair<int,int> b){
    return a.first<b.first;
}

bool comp1des(pair<int,int> a,pair<int,int> b){
    return a.first>b.first;
}

bool comp2asc(pair<int,int> a,pair<int,int> b){
    return a.second<b.second;
}

bool comp2des(pair<int,int> a,pair<int,int> b){
    return a.second>b.second;
}

//Some bitwise operators related functions:-
int getBit(int n,int i){
    return (n&(1<<i))!=0;
}

int setBit(int n,int i){
    return (n|(1<<i));
}

int clearBit(int n,int i){
    return n&(~(1<<i));
}

int updateBit(int n,int i,int value){
    if(value){return setBit(n,i);}
    else{return clearBit(n,i);}
}

int toggleBit(int n,int i){
    return n^(1<<i);
}

bool ispowerof2(int n){
    return n&&(!(n&(n-1)));
}

int powerof2(int k){
    return 1<<k;
}

int multiplywith2powk(int n,int k){
    return n<<k;
}

int dividewith2powk(int n,int k){
    //It will give floor of n/pow(2,k).
    return n>>k;
}

int modulo2powerk(int n,int k){
    return n&((1<<k)-1);
}

void SWAP(int &x,int &y){
    x=x^y;
    y=x^y;
    x=x^y;
}

bool iseven(int n){return (n&1)==0;}
bool isodd(int n){return (n&1)==1;}

ll OR(ll a,ll b){
    ll n=0;
    // Only for 32 bit numbers.
    f(i,32){
        unsigned ll c=powerof2(i);
        unsigned ll low=a/c+1;
        unsigned ll high=b/c+1;
        if(iseven(low)){
            n|=(1<<i);
        }
        else if(high-low){
            n|=(1<<i);
        }
    }
    return n;
}

ll AND(ll a,ll b){
    ll n=0;
    f(i,32){
        unsigned ll c=powerof2(i);
        unsigned ll low=a/c+1;
        unsigned ll high=b/c+1;
        if(!(isodd(low)||(high-low)>0)){
            n|=(1<<i);
        }
    }
    return n;
}

// To count the number of bits in a number use __builtin_popcount(x) or __builtin_popcountll(x)

void vectori_display(vi &v,int n){
    f(i,n){
        cout<<v[i]<<" ";
        }
}

void vectori_input(vi &v,int n){
    int temp;
    f(i,n){
        cin>>temp;
        v.push_back(temp);
    }
}

void vectorl_input(vl &v,int n){
    ll temp;
    f(i,n){
        cin>>temp;
        v.push_back(temp);
    }
}

ll power(ll a,ll b,ll mod=0){
    ll p=1;
    while(b){
        if((b&1)){
            p*=a;
            if(mod){p%=mod;}
        }
        a*=a;
        if(mod){a%=mod;}
        b=(b>>1);
    }
    return p;
}

int numberofdigits(ll x){
    int n=0;
    while(x/power(10,n)){n++;}
    return n;
}

void solve(){
    int n;
    cin>>n;
    vi a;
    vectori_input(a,n);
}

int main(){
    std::ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    ll t=1;
    cin>>t;
    while(t--){
    solve();
}
    return 0;
}