#include <bits/stdc++.h>
using namespace std;

#define f(i,n) for(int i=0;i<n;i++)
#define vi vector<int>

void vectori_input(vi &v,int n){
    int temp;
    f(i,n){
        cin>>temp;
        v.push_back(temp);
    }
}

void solve(){
    int n;
    cin>>n;
    vi a;
    vectori_input(a,n);
    int maxsum=0;
    int csum=0;
    f(i,n){
        csum+=a[i];
        if(csum<0){csum=0;}
        if(csum>maxsum){maxsum=csum;}
    }
    cout<<maxsum<<"\n";
}

int main(){
    std::ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t=1;
    // cin>>t;
    while(t--){
    solve();
}
    return 0;
}