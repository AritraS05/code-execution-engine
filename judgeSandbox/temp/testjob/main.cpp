#include <iostream>
#include <fstream>
using namespace std;

int main() {
    ifstream fin("input.txt");
    if (!fin.is_open()) {
        cerr << "Error: Could not open input.txt" << endl;
        return 1;
    }
    int t;
    fin >> t;
    while(t--){
        int x;
        fin >> x;
        cout << x << endl;
    }
    fin.close();
    return 0;
}
