import subprocess
import tempfile
import os
import sys
from typing import Dict, Any, Optional

class CodeExecutor:
    """Code execution service with Judge0 fallback to local execution"""
    
    @staticmethod
    def execute_python_code(code: str, stdin_input: str = "") -> Dict[str, Any]:
        """
        Execute Python code locally (for development/testing purposes)
        This is NOT secure for production use!
        """
        try:
            # Create a temporary file for the code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Execute the code with input
                result = subprocess.run(
                    [sys.executable, temp_file],
                    input=stdin_input,
                    capture_output=True,
                    text=True,
                    timeout=10  # 10 second timeout
                )
                
                return {
                    "stdout": result.stdout.strip(),
                    "stderr": result.stderr.strip() if result.stderr else None,
                    "compile_output": None,
                    "return_code": result.returncode,
                    "success": result.returncode == 0
                }
            finally:
                # Clean up the temporary file
                os.unlink(temp_file)
                
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timeout (10 seconds)",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
    
    @staticmethod
    def execute_javascript_code(code: str, stdin_input: str = "") -> Dict[str, Any]:
        """Execute JavaScript code using Node.js"""
        try:
            # Create a temporary file for the code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Execute the code with input
                result = subprocess.run(
                    ["node", temp_file],
                    input=stdin_input,
                    capture_output=True,
                    text=True,
                    timeout=10  # 10 second timeout
                )
                
                return {
                    "stdout": result.stdout.strip(),
                    "stderr": result.stderr.strip() if result.stderr else None,
                    "compile_output": None,
                    "return_code": result.returncode,
                    "success": result.returncode == 0
                }
            finally:
                # Clean up the temporary file
                os.unlink(temp_file)
                
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timeout (10 seconds)",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
    
    @staticmethod
    def execute_cpp_code(code: str, stdin_input: str = "") -> Dict[str, Any]:
        """
        Execute C++ code locally
        """
        try:
            # Create temporary files for source and executable
            with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as f:
                f.write(code)
                source_file = f.name
            
            executable_file = source_file.replace('.cpp', '.exe')
            
            try:
                # Compile the code
                compile_result = subprocess.run(
                    ['g++', '-o', executable_file, source_file],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if compile_result.returncode != 0:
                    return {
                        "stdout": "",
                        "stderr": compile_result.stderr.strip(),
                        "compile_output": compile_result.stderr.strip(),
                        "return_code": compile_result.returncode,
                        "success": False
                    }
                
                # Execute the compiled code
                result = subprocess.run(
                    [executable_file],
                    input=stdin_input,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                return {
                    "stdout": result.stdout.strip(),
                    "stderr": result.stderr.strip() if result.stderr else None,
                    "compile_output": None,
                    "return_code": result.returncode,
                    "success": result.returncode == 0
                }
            finally:
                # Clean up temporary files
                try:
                    os.unlink(source_file)
                    if os.path.exists(executable_file):
                        os.unlink(executable_file)
                except:
                    pass
                
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timeout (10 seconds)",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
    
    @staticmethod
    def execute_c_code(code: str, stdin_input: str = "") -> Dict[str, Any]:
        """Execute C code locally"""
        try:
            # Create temporary files for source and executable
            with tempfile.NamedTemporaryFile(mode='w', suffix='.c', delete=False) as f:
                f.write(code)
                source_file = f.name
            
            executable_file = source_file.replace('.c', '.exe')
            
            try:
                # Compile the code
                compile_result = subprocess.run(
                    ['gcc', '-o', executable_file, source_file],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if compile_result.returncode != 0:
                    return {
                        "stdout": "",
                        "stderr": compile_result.stderr.strip(),
                        "compile_output": compile_result.stderr.strip(),
                        "return_code": compile_result.returncode,
                        "success": False
                    }
                
                # Execute the compiled code
                result = subprocess.run(
                    [executable_file],
                    input=stdin_input,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                return {
                    "stdout": result.stdout.strip(),
                    "stderr": result.stderr.strip() if result.stderr else None,
                    "compile_output": None,
                    "return_code": result.returncode,
                    "success": result.returncode == 0
                }
            finally:
                # Clean up temporary files
                try:
                    os.unlink(source_file)
                    if os.path.exists(executable_file):
                        os.unlink(executable_file)
                except:
                    pass
                
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timeout (10 seconds)",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
    
    @staticmethod
    def execute_java_code(code: str, stdin_input: str = "") -> Dict[str, Any]:
        """Execute Java code locally"""
        try:
            # Extract class name from code
            import re
            class_match = re.search(r'public\s+class\s+(\w+)', code)
            if not class_match:
                return {
                    "stdout": "",
                    "stderr": "Could not find public class in Java code",
                    "compile_output": "Could not find public class in Java code",
                    "return_code": -1,
                    "success": False
                }
            
            class_name = class_match.group(1)
            
            # Create temporary directory for Java files
            temp_dir = tempfile.mkdtemp()
            source_file = os.path.join(temp_dir, f"{class_name}.java")
            
            try:
                # Write the source file
                with open(source_file, 'w') as f:
                    f.write(code)
                
                # Compile the code
                compile_result = subprocess.run(
                    ['javac', source_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=temp_dir
                )
                
                if compile_result.returncode != 0:
                    return {
                        "stdout": "",
                        "stderr": compile_result.stderr.strip(),
                        "compile_output": compile_result.stderr.strip(),
                        "return_code": compile_result.returncode,
                        "success": False
                    }
                
                # Execute the compiled code
                result = subprocess.run(
                    ['java', class_name],
                    input=stdin_input,
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=temp_dir
                )
                
                return {
                    "stdout": result.stdout.strip(),
                    "stderr": result.stderr.strip() if result.stderr else None,
                    "compile_output": None,
                    "return_code": result.returncode,
                    "success": result.returncode == 0
                }
            finally:
                # Clean up temporary directory
                try:
                    import shutil
                    shutil.rmtree(temp_dir)
                except:
                    pass
                
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timeout (10 seconds)",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }
    
    @staticmethod
    def execute_code(code: str, language_id: int, stdin_input: str = "") -> Dict[str, Any]:
        """
        Execute code based on language_id
        Language IDs: 71=Python, 63=JavaScript, 54=C++, 50=C, 62=Java
        """
        if language_id == 71:  # Python
            return CodeExecutor.execute_python_code(code, stdin_input)
        elif language_id == 63:  # JavaScript
            return CodeExecutor.execute_javascript_code(code, stdin_input)
        elif language_id == 54:  # C++
            return CodeExecutor.execute_cpp_code(code, stdin_input)
        elif language_id == 50:  # C
            return CodeExecutor.execute_c_code(code, stdin_input)
        elif language_id == 62:  # Java
            return CodeExecutor.execute_java_code(code, stdin_input)
        else:
            # For unsupported languages, return error
            return {
                "stdout": "",
                "stderr": f"Language ID {language_id} is not supported",
                "compile_output": None,
                "return_code": -1,
                "success": False
            }

