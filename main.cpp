#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>

void framebuffer_size_callback(GLFWwindow* window, int width, int height);
void processInput(GLFWwindow *window);


// window settings
const unsigned int SCREEN_WIDTH = 800;
const unsigned int SCREEN_HEIGHT = 600;

int main() {

    // GLFW - init and config
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    // GLFW - create window
    GLFWwindow* window = glfwCreateWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "OpenGL", NULL, NULL);
    if (window == NULL) {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    } 
    glfwMakeContextCurrent(window);

    // GLFW - register window resize callback
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    // GLAD init, load OpenGL function pointers
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }

    // RENDER LOOP --------------------------------------
    while (!glfwWindowShouldClose(window)) {

        // input -----
        processInput(window);

        // render ----
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        
        glfwSwapBuffers(window);                    // swap buffers (double buffer - separate output and rendering buffer to reduce artifacts)
        glfwPollEvents();                           // checks for keyboard input, mouse movement... etc.
    }
    
    glfwTerminate();
    return 0;
}

// GLFW - callback function to account for window resizing
void framebuffer_size_callback([[maybe_unused]] GLFWwindow* window, int width, int height) {
    // tell OpenGL the size of the rendering viewport
    glViewport(0, 0, width, height);
}

// GLFW - process input, queries GLFW to detect if certain keys are pressed/released this frame
void processInput(GLFWwindow *window) {
    // close the window if user presses "ESC" key
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS) glfwSetWindowShouldClose(window, true);
}
