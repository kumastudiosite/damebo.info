[_tb_system_call storage=system/_scene1.ks]

[cm  ]
[tb_image_hide  time="1000"  ]
[bg  storage="school_classroom.png"  time="1000"  method="fadeIn"  ]
[tb_show_message_window  ]
[chara_show  name="nao"  time="1000"  wait="true"  storage="chara/1/nao.png"  width="552"  height="1269"  left="281"  top="42"  reflect="false"  ]
[tb_start_text mode=1 ]
#宇都宮なお
ダメボはダメージボイス専門の音声素材集です。[p]
同じシチュエーションで複数の声優さんが演じています。[p]
今回は私、宇都宮なおのボイスをいくつかサンプルで収録しました。[p]
ボタンを押して聴いてみてください。[p]

[_tb_end_text]

*modori

[glink  color="rosy"  storage="scene1.ks"  size="20"  x="147"  y="91"  width=""  height=""  text="voice001"  _clickable_img=""  target="*voice001"  ]
[glink  color="rosy"  storage="scene1.ks"  size="20"  text="voice002"  x="147"  y="187"  width=""  height=""  _clickable_img=""  target="*voice002"  ]
[s  ]
*voice001

[playse  volume="100"  time="1000"  buf="0"  storage="damebo001_09.mp3"  ]
[jump  storage="scene1.ks"  target="*modori"  ]
*voice002

[playse  volume="100"  time="1000"  buf="0"  storage="damebo001_99.mp3"  ]
[jump  storage="scene1.ks"  target="*modori"  cond=""  ]
[s  ]
