n=int(input())
a=[int(i) for i in input().split()]

maxsum=0
csum=0
for i in range(n):
    csum+=a[i]
    if csum<0:
        csum=0
    if csum>maxsum:
        maxsum=csum
print(maxsum)