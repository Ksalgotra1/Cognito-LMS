class TrieNode:
    """
    A single node in the Trie (Prefix Tree).
    
    Optimization:
    We use __slots__ to define a fixed set of attributes. This prevents the 
    creation of a dynamic __dict__ for every single node instance.
    In a large tree with 100k+ nodes, this reduces memory usage by approx 40-50%.
    """
    __slots__ = ['children', 'is_end_of_word', 'data']

    def __init__(self):
        # Dictionary mapping characters to child TrieNodes
        self.children = {}
        # Boolean flag to mark if this node represents the end of a valid title
        self.is_end_of_word = False
        # List to store the actual object data (id, title, type) at this node
        self.data = []

class CourseTrie:
    """
    The main Trie class that manages insertions and search operations.
    """
    def __init__(self):
        self.root = TrieNode()

    def insert(self, text, item_data):
        """
        Inserts a string (text) and its associated metadata (item_data) into the Trie.
        
        Time Complexity: O(L), where L is the length of the text.
        """
        node = self.root
        # Normalize text to ensure case-insensitive search
        clean_text = text.lower().strip()
        
        for char in clean_text:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        
        node.is_end_of_word = True
        node.data.append(item_data)

    def search(self, prefix):
        """
        Searches for all items starting with the given prefix.
        
        Time Complexity: O(P + N), where P is prefix length and N is the number of descendants.
        """
        node = self.root
        clean_prefix = prefix.lower().strip()

        # Step 1: Traverse down the tree to the end of the prefix
        for char in clean_prefix:
            if char not in node.children:
                return [] # Prefix not found
            node = node.children[char]
        
        # Step 2: Recursively collect all data from this node downwards
        return self._collect_all(node)

    def _collect_all(self, node):
        """
        Helper method to gather all data from children nodes recursively.
        """
        results = []
        
        # If this node marks the end of a word, add its data to results
        if node.is_end_of_word:
            results.extend(node.data)
        
        # Recursively visit all children
        for char in node.children:
            results.extend(self._collect_all(node.children[char]))
        
        return results