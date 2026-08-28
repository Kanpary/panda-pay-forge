<?php
// Inicia a sessão para poder manipulá-la
session_start();

// Limpa todas as variáveis de sessão atuais (remove o id do utilizador, nome, etc)
session_unset();

// Destrói a sessão completamente do servidor
session_destroy();

// Redireciona o utilizador de volta para a página inicial
header("Location: index.php");
exit();
?>