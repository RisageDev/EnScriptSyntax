# EnScriptSyntax  

**EnScriptSyntax** — The best version of Enforce Script autocomplete and syntax highlighting for DayZ 1.27!  

## 🔥 Features  
✅ Full Enforce Script syntax highlighting  
✅ Automatic class and inheritance chain detection  
✅ Autocompletion for methods and functions based on parent classes  
✅ Type-based variable registration  
✅ Bracket matching and closing  

## 🚀 Installation  
1. Open **VSCode**  
2. Go to **Extensions** (`Ctrl + Shift + X`)  
3. Search for **"EnScriptSyntax"**  
4. Click **Install**  

## 🛠️ How to Use  
- Create a file with `.c` extension  
- Start typing Enforce Script code  
- Autocomplete and suggestions will appear automatically  
- Use `Ctrl + Space` to trigger suggestions manually  

## 💡 Example  
```c
class PlayerBase {
    void Test() {
        PlayerBase player;
        player.SetPosition();
    }
}

class NewClass extends PlayerBase {
    void ExampleMethod() {
        // Autocomplete will suggest methods from PlayerBase
        SetPosition();
    }
}
